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
  middlewares/   request logger, requireAuth (JWT check)
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
| GET | `/notes` | no | List notes, one page at a time |
| GET | `/notes/filter` | no | Substring search over notes |
| GET | `/notes/:id` | no | One note |
| POST | `/notes` | yes | Create a note |
| PUT / DELETE | `/notes/:id` | yes | Edit or delete a note |
| POST | `/users` | no | Create an account |
| POST | `/login` | no | Log in and receive a JWT |
| POST | `/ai/complete` | yes | Draft a note from a prompt |

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
cd backend && npm test        # API tests (Jest)
cd frontend && npm test       # end-to-end tests (Playwright)
```

## Security exercise: stored XSS, attack and defense

Part of the assignment was to attack the site and then defend it.

- **Attack.** A note can store HTML, so a malicious note is a stored XSS payload: it runs in the browser of everyone who views it. `attacker_server.js` is the small local server the payload reports to. It logs the keystrokes the injected script captures, which land in `keylog.txt`, and it sets permissive CORS headers so the victim's browser accepts the cross-origin request. Start it with `npm run attacker` in `backend/`.
- **Defense.** `frontend/src/sanitizer.ts` parses note content into a DOM and strips script-like tags and dangerous attributes before rendering. The app has a switch to turn it off, so you can watch the attack work and then watch the sanitizer stop it.

This is a learning exercise and is meant to run only on your own machine.
