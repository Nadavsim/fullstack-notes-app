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
| GET | `/notes` | no | List notes, one page at a time |
| GET | `/notes/filter` | no | Substring search over notes |
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
| Username already taken | 400 | `USERNAME_TAKEN` |
| Ollama unreachable / agent timeout | 502 / 504 | `AI_UNREACHABLE` / `AI_TIMEOUT` |
| Anything unexpected | 500 | `INTERNAL_ERROR` (generic message, details only in the server log) |

### Decisions

- **`error` stays a string.** The frontend shows `data.error`. Keeping it a readable string (the field messages joined together) means no frontend change. `code` and `details` are additive, for clients that want them.
- **One `validate({ params, query, body })` middleware** takes zod schemas, collects *all* problems in one response, and replaces the raw input with the parsed result. Unknown fields are stripped, so a client can never set `author` or other fields it should not control.
- **Auth runs before validation** on protected routes, so anonymous callers cannot learn the schemas from error messages.
- **`AppError` separates expected errors from bugs.** Controllers and services `throw AppError.notFound(...)` and similar. Express 5 forwards rejected promises to the error handler, so controllers no longer need `try/catch`. Anything that is not an `AppError` is logged and returned as a generic 500, so internals never leak.
- **Login validation does not enforce password rules**, so a failed login never reveals the password policy.
- **Limits** (title 200, content 10,000, password 3 to 72 because bcrypt ignores bytes past 72) are sensible defaults, not product requirements.
- **Behavior changes:** a malformed note id or index now gives a 400 (it was a 500), and `_page=abc` is now a 400 (it was silently page 1).

### What I would improve

- Return 409 for duplicate usernames by catching Mongo's duplicate-key error (code 11000). Today a sign-up race between the `findOne` check and `save` ends in a 500.
- Check note ownership on edit and delete. Any logged-in user can currently change any note.
- Escape the `/notes/filter` query before using it as a regex, to rule out regex-based slow queries.
- Add a request id to every log line and error response, and use a structured logger instead of `console.error`.
- Share the zod schemas with the frontend (or generate an OpenAPI spec) so forms and the API validate the same rules.
- Replace the deprecated `{ new: true }` option in `findByIdAndUpdate` with `returnDocument: 'after'`.
- Add a unit test for the error handler itself and cover the Ollama failure path with a mocked `fetch`.

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
