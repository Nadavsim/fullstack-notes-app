# Fullstack Notes App

A full-stack notes website with user accounts, cached pagination and an AI assistant that drafts notes from the notes already in the database. Built for a university full-stack web development course.

Guests can read notes. Logged-in users can create, edit and delete them.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Playwright |
| Backend | Node.js, Express 5, TypeScript, Jest |
| Database | MongoDB with Mongoose |
| Auth | bcrypt password hashes, JSON Web Tokens |
| AI | Ollama running `qwen2.5:3b` locally, with tool calling |

## Features

- **Accounts.** Sign up and log in. Passwords are stored as bcrypt hashes and sessions use signed JWTs. Write routes sit behind an auth middleware, and the name, email and username of an account can't be changed after creation.
- **Pagination written from scratch.** The pagination bar is a hand-built component, with no pagination library.
- **Page cache.** The pages shown in the pagination bar (five at a time) are held in a client-side cache. Moving to a cached page needs no request, and moving one page along fetches only the one page that entered the bar, in the background.
- **Notes-based AI assistant.** Press the ★ button on the new-note form, type a prompt, and a local LLM drafts a note. The model can call a `filter_notes(query)` tool that searches the notes in the database, so its draft is grounded in your own data instead of only its training data. AI responses are never cached.
- **XSS protection.** Note content is passed through a DOM-based sanitizer (`frontend/src/sanitizer.ts`) that removes script-like tags and dangerous attributes before it is rendered. The app has a switch to turn the sanitizer off, which the security exercise below uses to show the attack working.

## Architecture

The backend keeps one direction of flow, from request to database:

```
middleware -> router -> controller -> service -> model
```

```
backend/
  middlewares/   request logger, requireAuth (JWT check), validate (zod), errorHandler
  schemas/       zod schemas for request bodies, params and queries
  utils/         AppError (typed, expected errors)
  routes/        notes, users, login, ai
  controllers/   HTTP in and out
  services/      business logic, including aiService (Ollama tool loop)
  models/        Note and User schemas
  tests/         Jest + Supertest API tests
frontend/
  src/components/  AddNote, Notes, Pagination, Login, CreateUser
  src/contexts/    NoteContext (notes state and page cache)
  playwright-tests/  end-to-end tests
```

### API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/notes` | no | List notes, one page at a time, sortable (`_sort`, `_order`) |
| GET | `/notes/filter` | no | Word search over note titles and content (text index) |
| GET | `/notes/:id` | no | One note |
| POST | `/notes` | yes | Create a note |
| PUT / DELETE | `/notes/:id` | yes | Edit or delete a note |
| POST | `/users` | no | Create an account |
| POST | `/login` | no | Log in and receive a JWT |
| POST | `/ai/complete` | yes | Draft a note from a prompt |

## Request validation and error handling

Every request is validated with [zod](https://zod.dev) before it reaches a controller, and every error leaves the API through one error-handling middleware in one consistent shape.

```
request -> logger -> router -> requireAuth -> validate(zod) -> controller -> service
                                                  | invalid        | any throw / rejected promise
                                                  +-----> next(err) <-----+
                                                              |
                                                       errorHandler -> JSON
```

### Error response format

```json
{
  "error": "Title must not be empty; Content is required",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "title", "message": "Title must not be empty" },
    { "field": "content", "message": "Content is required" }
  ]
}
```

| Case | Status | `code` |
| --- | --- | --- |
| Invalid body, param or query | 400 | `VALIDATION_ERROR` |
| Malformed JSON body | 400 | `INVALID_JSON` |
| Missing or invalid token | 401 | `UNAUTHORIZED` |
| Wrong username or password | 401 | `INVALID_CREDENTIALS` |
| Note, user or route not found | 404 | `NOT_FOUND` |
| Username already taken (also when two sign-ups race) | 409 | `USERNAME_TAKEN` / `DUPLICATE_KEY` |
| Ollama unreachable / agent timeout | 502 / 504 | `AI_UNREACHABLE` / `AI_TIMEOUT` |
| Anything unexpected | 500 | `INTERNAL_ERROR` (generic message, details only in the server log) |

### Decisions

- **`error` stays a string.** The frontend shows `data.error`. Keeping it a readable string (the field messages joined together) means no frontend change. `code` and `details` are additive, for clients that want them.
- **One `validate({ params, query, body })` middleware** takes zod schemas, collects *all* problems in one response, and replaces the raw input with the parsed result. Unknown fields are stripped, so a client can never set `author` or other fields it should not control.
- **Auth runs before validation** on protected routes, so anonymous callers cannot learn the schemas from error messages.
- **`AppError` separates expected errors from bugs.** Controllers and services `throw AppError.notFound(...)` and similar. Express 5 forwards rejected promises to the error handler, so controllers no longer need `try/catch`. Anything that is not an `AppError` is logged and returned as a generic 500, so internals never leak.
- **Login validation does not enforce password rules**, so a failed login never reveals the password policy.
- **Limits** (title 200, content 10,000, password 3 to 72 because bcrypt ignores bytes past 72) are sensible defaults, not product requirements.
- **Duplicates are decided by the database.** The `findOne` check in the user service only gives a friendly message in the common case. Two simultaneous sign-ups can both pass it, so the unique index is the real guard, and the error handler turns Mongo's duplicate-key error (code 11000) into a 409 instead of a 500.
- **Behavior changes:** a duplicate username is now a 409 (it was a 400), a malformed note id or index now gives a 400 (it was a 500), and `_page=abc` is now a 400 (it was silently page 1).

### What I would improve

- Check note ownership on edit and delete. Any logged-in user can currently change any note.
- Add a request id to every log line and error response, and use a structured logger instead of `console.error`.
- Share the zod schemas with the frontend (or generate an OpenAPI spec) so forms and the API validate the same rules.
- Replace the deprecated `{ new: true }` option in `findByIdAndUpdate` with `returnDocument: 'after'`.
- Add a unit test for the error handler itself and cover the Ollama failure path with a mocked `fetch`.

## Sorting and search indexes

### Sorting `GET /notes`

```
GET /notes?_sort=title&_order=asc&_page=2&_per_page=10
```

| Parameter | Values | Default |
| --- | --- | --- |
| `_sort` | `createdAt`, `title` | `createdAt` |
| `_order` | `asc`, `desc` | `desc` |

The defaults keep the old behavior (newest first). Any other `_sort` or `_order` value is a 400 `VALIDATION_ERROR`.

### Search `GET /notes/filter?query=...`

Searches whole words in the title and content, best matches first, at most 10 results.

- Case-insensitive, with stemming: `flamingos` finds `flamingo`.
- Several words match any of them. `"exact phrase"` must appear as written. `-word` excludes notes containing that word.
- It does **not** match parts of words: `flam` finds nothing.

### Indexes (defined in `backend/models/Note.ts`)

| Index | Keys | Serves |
| --- | --- | --- |
| `_id_` (built in) | `_id` | Sorting by `createdAt` |
| `title_sort` | `{ title: 1, _id: 1 }` with a case-insensitive, number-aware collation | Sorting by `title`, both directions |
| `notes_text` | text index on `title` (weight 5) and `content` (weight 1) | `/notes/filter` and the AI `filter_notes` tool |

Mongoose creates them when the app connects. The tests in `backend/tests/sorting-search.test.ts` run `explain()` and fail if a query stops using its index.

### Decisions

- **`createdAt` is served by `_id`.** An ObjectId starts with its creation time, so sorting by `_id` is sorting by date, and every collection already has that index. The schema has no `createdAt` field, and adding one now would leave existing notes without it.
- **Only allowed sort fields.** Sorting on a field with no index makes MongoDB sort the whole collection in memory, which gets slow and fails beyond about 100 MB. A 400 is better than a slow query.
- **`_id` is always the last sort key.** Many notes share a title, and without a unique tie-breaker their order is not fixed, so a note could appear on two pages or on none.
- **A collation on the title sort and its index.** Titles sort ignoring case, and `Note 9` comes before `Note 10`. The query must ask for the same collation as the index, or MongoDB ignores the index and sorts in memory. The `explain()` test checks this.
- **A text index instead of a regex.** A regular index cannot speed up a case-insensitive "contains" regex, because the match can start anywhere in the string. A text index is used directly, ranks results by relevance, and no longer turns user input into a regex (which removed the slow-regex risk). The trade-off is word matching instead of substring matching. The AI tool description was updated to say so.
- **Search now covers titles too**, with title matches weighted 5 times higher than content matches.
- **The relevance sort is still an in-memory `SORT` stage**, but only over the matched notes, not the whole collection. A score is computed per query, so no index can store it.

### What I would improve

- **Keyset (cursor) pagination.** `skip` still walks past every skipped index entry, so page 1,000 reads about 10,000 entries. Paging with "after this title and `_id`" costs the same on every page.
- **Partial-word search** (as-you-type) with Atlas Search autocomplete or n-grams, if users need `flam` to find `flamingo`.
- **Create indexes in a deploy step** and turn off Mongoose `autoIndex` in production. Building an index on a large collection is expensive, and changing an existing index's options (for example the collation) needs a drop-and-rebuild migration.
- **Use `estimatedDocumentCount()`** for the unfiltered `X-Total-Count`, which reads stored metadata instead of counting.
- **Frontend sort control.** The page cache in `NoteContext` would need to be keyed by sort order, or cleared when it changes.
- **Per-note search language.** The text index uses English stemming and stop words for every note.

## Running it locally

You need Node.js, a MongoDB database, and [Ollama](https://ollama.com/download) with the model pulled:

```bash
ollama pull qwen2.5:3b
```

Create `backend/.env`:

```
MONGODB_CONNECTION_URL=<your MongoDB connection string>
TEST_MONGODB_CONNECTION_URL=<a separate database used by the tests>
SECRET=<a long random string used to sign JWTs>
PORT=<port for the API>
```

Start the backend and the frontend in two terminals:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

`npm run seed` in `backend/` fills the database with sample notes for an existing user named `testuser1`, so create that account first.

## Tests

```bash
cd backend && npm test        # API tests (Jest); validation.test.ts needs no database
cd frontend && npm test       # end-to-end tests (Playwright)
```

## Security exercise: stored XSS, attack and defense

Part of the assignment was to attack the site and then defend it.

- **Attack.** A note can store HTML, so a malicious note is a stored XSS payload: it runs in the browser of everyone who views it. `attacker_server.js` is the small local server the payload reports to. It logs the keystrokes the injected script captures, which land in `keylog.txt`, and it sets permissive CORS headers so the victim's browser accepts the cross-origin request. Start it with `npm run attacker` in `backend/`.
- **Defense.** `frontend/src/sanitizer.ts` parses note content into a DOM and strips script-like tags and dangerous attributes before rendering. The app has a switch to turn it off, so you can watch the attack work and then watch the sanitizer stop it.

This is a learning exercise and is meant to run only on your own machine.
