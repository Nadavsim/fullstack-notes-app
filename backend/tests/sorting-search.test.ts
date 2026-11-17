import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../expressApp';
import Note, { TITLE_COLLATION } from '../models/Note';
import { buildSort } from '../services/notesService';

jest.setTimeout(30000);
const api = supertest(app);

// Collect every stage name in an explain() plan, e.g. ["LIMIT", "FETCH", "IXSCAN(title_sort)"]
const planStages = (explain: any): string[] => {
  const out: string[] = [];
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (node.stage) out.push(node.stage + (node.indexName ? `(${node.indexName})` : ''));
    Object.values(node).forEach(walk);
  };
  walk((Array.isArray(explain) ? explain[0] : explain).queryPlanner.winningPlan);
  return out;
};

// Same rules as TITLE_COLLATION, in JavaScript: ignore case, compare digits as numbers
const titleCompare = new Intl.Collator('en', { sensitivity: 'accent', numeric: true }).compare;

// Made-up words, so the search tests don't depend on what else is in the test database
const SEARCH_NOTES = [
  { title: 'Quuxberry harvest', content: 'notes about the farm' },      // word in the title
  { title: 'Farm diary', content: 'today we picked quuxberries' },        // word in the content (plural)
];
const SEARCH_TITLES = SEARCH_NOTES.map((n) => n.title);

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.TEST_MONGODB_CONNECTION_URL as string);
  }
  await Note.init(); // make sure the schema indexes exist before asserting on query plans
  await Note.deleteMany({ title: { $in: SEARCH_TITLES } });
  await Note.create(SEARCH_NOTES);
});

afterAll(async () => {
  await Note.deleteMany({ title: { $in: SEARCH_TITLES } });
  await mongoose.connection.close();
});

describe('buildSort', () => {
  it('maps createdAt to _id, because an ObjectId starts with its creation time', () => {
    expect(buildSort({ field: 'createdAt', order: 'desc' })).toEqual({ _id: -1 });
    expect(buildSort({ field: 'createdAt', order: 'asc' })).toEqual({ _id: 1 });
  });

  it('adds _id as a tie-breaker to the title sort', () => {
    expect(buildSort({ field: 'title', order: 'asc' })).toEqual({ title: 1, _id: 1 });
    expect(buildSort({ field: 'title', order: 'desc' })).toEqual({ title: -1, _id: -1 });
  });
});

describe('GET /notes sorting', () => {
  it('defaults to newest first', async () => {
    const res = await api.get('/notes').expect(200);
    const ids = res.body.map((n: any) => n.id);
    // ObjectId hex strings have a fixed length, so string order == creation order
    expect(ids).toEqual([...ids].sort().reverse());
  });

  it('sorts oldest first with _sort=createdAt&_order=asc', async () => {
    const res = await api.get('/notes?_sort=createdAt&_order=asc').expect(200);
    const ids = res.body.map((n: any) => n.id);
    expect(ids).toEqual([...ids].sort());
  });

  it.each(['asc', 'desc'])('sorts by title %s, ignoring case and comparing numbers as numbers', async (order) => {
    const res = await api.get(`/notes?_sort=title&_order=${order}`).expect(200);
    const titles: string[] = res.body.map((n: any) => n.title);
    const expected = [...titles].sort(titleCompare);
    expect(titles).toEqual(order === 'asc' ? expected : expected.reverse());
  });

  it('keeps pages stable: no note appears on two pages, and order continues across pages', async () => {
    const page1 = (await api.get('/notes?_sort=title&_order=asc&_per_page=5&_page=1').expect(200)).body;
    const page2 = (await api.get('/notes?_sort=title&_order=asc&_per_page=5&_page=2').expect(200)).body;
    const ids1 = new Set(page1.map((n: any) => n.id));
    expect(page2.some((n: any) => ids1.has(n.id))).toBe(false);
    if (page2.length > 0) {
      expect(titleCompare(page1[page1.length - 1].title, page2[0].title)).toBeLessThanOrEqual(0);
    }
  });

  it('rejects a field that is not on the allowlist', async () => {
    const res = await api.get('/notes?_sort=author.email').expect(400);
    expect(res.body.details[0]).toEqual({ field: '_sort', message: '_sort must be one of: createdAt, title' });
  });

  it('rejects an unknown order', async () => {
    await api.get('/notes?_order=up').expect(400);
  });
});

describe('Indexes are actually used (query plans)', () => {
  it('title sort walks the title_sort index and never sorts in memory', async () => {
    const plan = planStages(
      await Note.find().sort(buildSort({ field: 'title', order: 'asc' })).collation(TITLE_COLLATION).limit(10).explain()
    );
    expect(plan).toContain('IXSCAN(title_sort)');
    expect(plan).not.toContain('SORT');
    expect(plan).not.toContain('COLLSCAN');
  });

  it('newest-first sort uses the built-in _id index', async () => {
    const plan = planStages(await Note.find().sort({ _id: -1 }).limit(10).explain());
    expect(plan).toContain('IXSCAN(_id_)');
    expect(plan).not.toContain('SORT');
  });

  it('filter search uses the notes_text index instead of scanning the collection', async () => {
    const plan = planStages(
      await Note.find({ $text: { $search: 'quuxberry' } }).sort({ score: { $meta: 'textScore' } }).explain()
    );
    expect(plan).toContain('IXSCAN(notes_text)');
    expect(plan).not.toContain('COLLSCAN');
  });
});

describe('GET /notes/filter text search', () => {
  const search = async (query: string) =>
    (await api.get('/notes/filter').query({ query }).expect(200)).body
      .map((n: any) => n.title)
      .filter((t: string) => SEARCH_TITLES.includes(t));

  it('finds words in title and content, ranking the title match first', async () => {
    expect(await search('quuxberry')).toEqual(['Quuxberry harvest', 'Farm diary']);
  });

  it('is case-insensitive and stems plurals', async () => {
    expect(await search('QUUXBERRIES')).toEqual(['Quuxberry harvest', 'Farm diary']);
  });

  it('does not match parts of words (the trade-off of a text index)', async () => {
    expect(await search('quux')).toEqual([]);
  });

  it('supports excluding a word with -', async () => {
    expect(await search('quuxberry -farm')).toEqual([]);
    expect(await search('quuxberry -harvest')).toEqual(['Farm diary']);
  });
});
