## Introduction

## Goals
This task's goals are:
- Adding users to our website. Only logged-in users can create new notes, but guests can view them without adding/editing/deleting notes. For simplicity, the name of the user, their email, the username, and the password, cannot be changed after user creation.
- Minimize user waiting time.
- Add a "Notes-based AI assistant" feature that uses the notes in the database as context. This is the integration layer real AI-powered web apps build today; you will wire your existing backend to a local LLM and expose a tool the LLM can call.


## Submission
- Coding: 70%, Questions: 30%.
- Your submitted git repo should be *private*, please add 'barashd@post.bgu.ac.il', 'Gal-Fadlon' and '[Yuval Tzvi Rays](https://github.com/YuvalZviRays)' to the list of collaborators.
- Do not use external libraries that provide the pagination component. If in doubt, contact the course staff.
- Deadline: 18.6.26, end of day.
- Additionally, solve the [theoretical questions](https://docs.google.com/forms/d/e/1FAIpQLSfw-8MCLhnovDPNXt5hsBYmtV8-aXtKX80x-KRSJ9EpdknJ_A/viewform?usp=dialog).
- Use TypeScript, and follow the linter's warnings (see eslint below). The linter can be faulty; use it to get early signs of bugs, the automatic tests will not take away points for linter warnings.

- Git repository content:
  - Aim for a minimal repository size that can be cloned and installed: most of the files in github should be code and package dependencies (add package.json, index.html).
  - Don't submit (add to git) .env (it's your secret file which includes passwords- add to gitignore), node_modules dir, package-lock.json, or note json files.
  - the submission commit will be tagged as "submission_hw3".
  - to test your submission, run the presubmission script (in github). A submission that does not pass the presubmission script, gets a 0 score automatically.
      For example:
      ```bash
      bash presubmission.sh git@github.com:bgu-frontend/hw3_2026.git <full_.env_path>/.env
      ```
      - Tip: You can use a local git directory as the target git repository.
      - Tip: You can make the presubmission script to run automatically during every git push.
      - Tip: `-x` argument to bash shows the currently executed line.

## AI

You are allowed to use AI assistants, but you must use them responsibly:

1. **Start alone.** Write the code yourself first. Use AI for the last stage: polishing, debugging, or checking your work. Not for regenerating components or whole files. This is how you actually learn.
2. **You must understand every bit of your code.** The directory structure, the middleware to router to controller to service to model flow, the reducer/context wiring, and every line: you need to be able to explain all of it. If you cannot explain your code in the oral exam, the coding grade will be reduced accordingly.
3. **Both students in each pair will be tested** in an oral exam. The tester may ask about anything in your code, and will not ask the same questions to both partners.

## Plagiarism
- We use a plagiarism detector.
- The person who copies and the person who was copied from are both responsible.
- Set your repository private, and don't share your code.

## Prerequisites
### Recommended reading:
-  User administration https://fullstackopen.com/en/part4/, and matching frontend support in part5.
-  Bcrypt format: https://en.wikipedia.org/wiki/Bcrypt.
-  JSON Web Token: https://jwt.io/introduction
-  Routing: https://v5.reactrouter.com/web/guides/quick-start
-  data-testid: https://playwright.dev/docs/locators#locate-by-test-id
-  Ollama quickstart: https://docs.ollama.com/quickstart
-  Ollama tool calling: https://docs.ollama.com/capabilities/tool-calling

### Tools
- **Ollama** — a local LLM runtime that loads open-source models and serves them over HTTP at `http://localhost:11434`. Install from [ollama.com/download](https://ollama.com/download), or on Linux: `curl -fsSL https://ollama.com/install.sh | sh`.
- **`qwen2.5:3b`** — the model the agent talks to: an open-weights 3-billion-parameter model from Alibaba's Qwen 2.5 family. Pull it with `ollama pull qwen2.5:3b`. If your machine has trouble running it, contact Danny.
- **`bcrypt`** (npm) — used to hash passwords when creating new users.
- **`jsonwebtoken`** (npm) — used to sign and verify JWTs in the login flow.


## Mongo
-  Add the user details to the notes schema :

```json
{
 title: string;
 author: {
 name: string;
 email: string;
 } | null;
 content: string;
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
};

```
-  Add a user collection with the following schema:
```json
{
  name: string,
  email: string,
  username: string,
  passwordHash: string
}
```



## Caching
In react, implement the following caching mechanism, to reduce backend/database pressure:
- We'll have 5 (=pagination size) pre-fetched pages.
- The pages we will store are the pages that are visible in the current page pagination bar (for example, if the current page is 5, and the shown pages are 3,4,5,6,7, then the cached pages are also 3,4,5,6,7).
- When the user is browsing to a new page:
    - If the current page is in the cache, it will be loaded from it.
    - Also, asynchronously in the background, the frontend will get the minimal amount of pages needed. For example, when moving from page 5 to 6, only one page should be fetched, since the rest are already in the cache.
        - It's ok to have 5 fetches of 10 notes each, instead of one fetch of 50 notes; it's ok to use the existing 10-notes fetching API.
- Examples:
    - Moving from page 1 to 2 should not fetch new data to the cache.
- We do not cache AI responses; every click on the notes-based AI assistant hits `/ai/complete` fresh.

## AI feature: "Notes-based AI assistant"

Modern editor experiences ship a button that asks an LLM to draft text. The interesting variant — and the one we build here — is the one that grounds the draft in *the app's own data*: not just a generic LLM response, but a response informed by the existing notes in our Mongo database. The LLM can ask the backend "show me notes that contain X" and weave the result into its answer. Without that data link, the feature is just a wrapper around ChatGPT; with it, the feature becomes part of *your* app.

The local LLM is served by **Ollama** (see [Tools](#tools) above): a free, open-source runtime that loads LLM models and exposes them over HTTP at `http://localhost:11434`. Your backend never embeds the model itself — it talks to Ollama over HTTP, just like it talks to Mongo.

### How it works

1. User clicks the ★ button on the new-note form, types a short prompt, and submits.
2. The frontend POSTs the prompt to the backend's AI endpoint.
3. The backend forwards the prompt to Ollama, together with a **tool catalog** — a list of functions the LLM may ask us to run on its behalf. A "tool" is the LLM-world equivalent of an API the model can call back into.
4. The one tool we expose is `filter_notes(query)`, which runs a substring search over the notes collection. This is what makes the AI feature useful: without tools, the LLM can only answer from its general training data — it has no idea what is in the database. With this tool, it can ask for the actual notes at the moment it is drafting. Compare to a normal REST route, where *we* decide ahead of time which Mongo queries each endpoint runs; with tool-calling, the LLM decides at runtime which search is relevant to what the user typed.
5. If the LLM emits a `filter_notes` call, the backend runs the corresponding query against Mongo and sends the matching notes back to the LLM for context.
6. The backend responds with the LLM's text; the frontend appends it to the new-note input.

**Concrete example.** A note in the database has `content`: *"Important note: my project uses cryptographic-handshake-v7 as the auth identifier."* The user submits the prompt *"Find a note that mentions cryptographic-handshake-v7 and tell me what identifier my project uses."* The LLM emits `filter_notes({ query: "cryptographic-handshake-v7" })`, the backend returns the matching note, and the LLM writes a final answer that contains the string `cryptographic-handshake-v7`. This is the exact pattern the `/ai/complete` Jest test asserts (see *Backend test requirements* below).

### What the agent does

The agent is a small loop around Ollama's chat API. Four pieces:

**1. Declare the tool catalog you expose to the LLM:**

```ts
const tools = [
  {
    type: 'function',
    function: {
      name: 'filter_notes',
      description: 'Search the notes collection by substring match on content. Returns up to 10 matches.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
];
```

**2. Send the user prompt and the tool catalog to Ollama:**

```ts
const r = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5:3b',
    messages,         // [{ role: 'user', content: prompt }, ...]
    tools,            // the array above
    stream: false,
  }),
});
const { message } = await r.json();
```

**3. If `message.tool_calls` is non-empty, dispatch each one and push the result back as a `tool` message:**

```ts
for (const call of message.tool_calls ?? []) {
  const args = typeof call.function.arguments === 'string'
    ? JSON.parse(call.function.arguments)
    : call.function.arguments;
  // Right now we only know one tool: filter_notes. Call your own endpoint.
  const r = await fetch(`http://localhost:3001/notes/filter?query=${encodeURIComponent(args.query)}`);
  messages.push({ role: 'tool', content: await r.text() });
}
```

**4. Wrap pieces 2–3 in a bounded loop.** Each iteration calls Ollama once. If the returned `message` has no `tool_calls` (the field is absent or an empty array), the loop ends and `runAgent` returns `{ text: message.content ?? '' }`. Otherwise, run piece 3's dispatch and continue. After `MAX_ROUND_TRIPS` iterations with no tool-call-free message, throw an `Error` with `status: 504` so `aiController` returns HTTP `504`.

```ts
const MAX_ROUND_TRIPS = 3;

for (let i = 0; i < MAX_ROUND_TRIPS; i++) {
  // piece 2: POST to /api/chat, get { message }, push it onto `messages`
  if (!message.tool_calls?.length) {
    return { text: message.content ?? '' };
  }
  // piece 3: dispatch each call in message.tool_calls and push tool results
}
const err = new Error('Agent exceeded round-trip cap') as Error & { status?: number };
err.status = 504;
throw err;
```

The cap is a safety net. A small local model occasionally gets stuck — calling the same tool repeatedly, or hallucinating a tool name and retrying. Without a cap a single request could hang for minutes. `MAX_ROUND_TRIPS = 3` is a chosen-by-experience value. Feel free to pick a different number; just keep it as a named constant and document the choice.

Export a single function:

```ts
export async function runAgent({ prompt }: { prompt: string }): Promise<{ text: string }> {
  // …the loop above…
}
```

### Expected directory structure (additions to hw2)

```
backend/
├── services/      # an agent service (the LLM loop) and a notes-filtering service
├── controllers/   # an AI controller plus a controller for the new notes-filter route
└── routes/        # an AI router plus the new /notes/filter route added to the existing notes router
```

### Expected routes (additions to hw2)

| Method | Endpoint | Body | Success | Errors |
|---|---|---|---|---|
| GET  | `/notes/filter?query=<q>` | — | `200 OK` array of up to 10 notes (substring match on `content`, chronological order), `X-Total-Count` header | `400` if `query` is missing, `500` |
| POST | `/ai/complete` | `{ prompt: string }` | `200 OK` `{ text: string }` | `400` invalid body, `401` not authenticated, `502` if Ollama unreachable, `504` if the agent times out, `500` |

> Note: `/notes/filter` is a public route — no authentication is required. This allows the backend agent to call it directly without a token when processing AI requests.

- 401: Unauthorized — the user is not authenticated (required for creating, editing, or deleting a note, and for the AI assistant), or supplied incorrect credentials during login.

### Backend test requirements

- **Backend - Jest:** 4 tests, write them in `crud.test.ts` (carry over the hw2 tests) plus `auth.test.ts`, `notes-filter.test.ts`, and `ai.test.ts`. Your tests should pass after running `npm run test` from the backend directory.

The four required tests:

1. **POST `/users`** — create a new user with the required fields from the Mongo schema; assert `201` and that the user is persisted (see https://fullstackopen.com/en/part4/token_authentication).
2. **POST `/login`** — submit valid credentials, assert `200` and a signed token in the response.
3. **GET `/notes/filter`** — seed a note whose `content` contains a distinctive keyword. Request `?query=<that-keyword>`. Assert `200` and that the returned array contains that note. Assert `400` when `query` is missing.
4. **POST `/ai/complete`** — seed a note whose `content` contains a distinctive keyword. POST `{ prompt: "<question that requires that keyword>" }`. Assert `200`, and that the response `text` contains the keyword (proves the agent fetched and used the seeded note).

### Frontend test requirements

- **Playwright:** 1 test for the notes-based AI assistant flow, written in `frontend/playwright-tests/test.spec.ts` (alongside your hw2 carry-over). Run with `npm run test` from the frontend directory.

The required test:

1. Log in via the login form. Click the `add_new_note` button to open the new-note form. Click `help_me_write`. Type a short prompt into `help_me_write_prompt`. Click `help_me_write_submit`. Assert that within 30 seconds the new-note text input contains text it did not before. (The exact content depends on the model; do not assert on substring; only assert that the input grew non-empty.)

### Notes for grading

We will not test concurrent AI requests. Grading sends one `/ai/complete` at a time; you don't need to handle parallel calls correctly.

## Frontend requirements

### Per-user behaviour
- Each note's `Edit`/`Delete` buttons are shown only for the author: the user must be logged in and their email must match the note author's email.

### Routes
- The application will have the following routes: (see react dom router)
    - `/` – Homepage: the same page we saw on the previous exercises, can be seen by all users, even if they did not log in.
      The homepage (when user is not logged in) will show **navigation buttons** that redirect to the login and create user pages:
        - **Login page button**:
            - Text: `Go to Login`
            - `data-testid`: **"go_to_login_button"**
        - **Create User page button**:
            - Text: `Create New User`
            - `data-testid`: **"go_to_create_user_button"**
    - `/login` – Login page containing the login form.
    - `/create-user` – Create User page containing the registration form.

### Components

- **Logout button** (`/` homepage when logged in):
    - `data-testid`: **"logout"**
    - Behavior:
        - Deletes the token from React state.
        - The user is now logged out (see: `/` homepage when not logged in).
        - _Comment: It should also be added to a blacklist on the server so it won't be used later. In this exercise, we won't use a blacklist._

- **Add Note Form** (`/` homepage when logged in):
    - Appears only when logged in.
    - The created note will include the current user's details.
    - Other than that, it's identical to the previous exercise.

- **Notes-based AI assistant button** (visible on the new-note form when logged in):
    - `data-testid`: `"help_me_write"`
    - Shown as a star icon next to the note text area.
    - On click, an inline text input and a Generate button appear next to the note body.
        - prompt input `data-testid`: `"help_me_write_prompt"`
        - Generate button `data-testid`: `"help_me_write_submit"`
    - On Generate, the frontend `POST`s `{ prompt: <input-value> }` to `POST /ai/complete`. On `200 OK`, the returned `text` is appended to the current note body (do not replace existing content).

- **Create User form** (`/create-user` route):
    - `data-testid` for form: **"create_user_form"**
    - Fields:
        - `Name`, `data-testid`: **"create_user_form_name"**
        - `Email`, `data-testid`: **"create_user_form_email"**. The email doesn't need to be verified for uniqueness or correctness.
        - `Username`, `data-testid`: **"create_user_form_username"**
        - `Password`, `data-testid`: **"create_user_form_password"**
    - Create User button (submit):
        - Text: `Create User`
        - `data-testid`: **"create_user_form_create_user"**
    - Behaviour: the user is saved in the database, and redirected back to the homepage (while still logged out).

- **Login form** (`/login` route):
    - `data-testid` for form: **"login_form"**
    - Fields:
        - `Username`, `data-testid`: **"login_form_username"**
        - `Password`, `data-testid`: **"login_form_password"**
    - Submit button:
        - Text: `Login`
        - `data-testid`: **"login_form_login"**
    - Behaviour: a successful login redirects the user to the home page, and they are now logged in. A failed attempt will print an error of your choice to the user, while staying on the same page.
    - Token behavior:
        - After login, the token is saved in React state.
        - All authenticated API requests will send the token via an `'Authorization'` header.
        - _Note: While the flowchart which we've seen in class explains that the token should be saved without exposing it to frontend JavaScript, Full Stack Open actual code stores it in the frontend state — this is for educational purposes, but not secure as HTTP-only cookies._

## The tester will:
- Assume Ollama is already running locally on `http://localhost:11434` with the `qwen2.5:3b` model pulled and available — you do not need to start it or ship the model. If your code reads `OLLAMA_URL` or `AI_MODEL` from the environment, default to these values when they are unset.
- `git clone <your_submitted_github_repo>`
- `cd <cloned_dir>`
- `git checkout submission_hw3`
- `npm install` from the `frontend` dir (package.json should exist)
- `npm run dev` from the `frontend` dir  (configured to default port 3000)
- Copy a `.env` file into the `backend` dir.
- `npm install` from the `backend` dir (package.json should exist)
- `node index.js` from the `backend` dir (configured to default port 3001)
- Run tests: frontend (playwright) and backend (jest).

## Appendix

### Suggestions

- Often, errors are lost between try/catch blocks, frontend/backend communication, and async functions which do not print to the console.
- Use a backend errorHandler middleware, as in [Limiting creating new notes to logged-in users](https://fullstackopen.com/en/part4/token_authentication#limiting-creating-new-notes-to-logged-in-users).

### Smoke-test the AI without the frontend

Before wiring up React, verify the backend works end to end with a single HTTP call. Make sure Mongo is reachable, Ollama is running (`curl http://localhost:11434/api/tags` should return JSON), your backend is running (`npm run dev` in `backend/`), and your `notes` collection contains at least one note whose `content` includes the keyword you put in the prompt (below: `react`).

With **curl**:

```bash
curl -X POST http://localhost:3001/ai/complete \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Find notes whose content contains the word react and summarize them."}'
```

Expected: `200 OK` with body `{ "text": "<the LLM's draft>" }`. Allow 5–10 seconds.

With **Postman**: create a new POST request to `http://localhost:3001/ai/complete`, set the body to `raw → JSON`, paste the same JSON body, click Send.

Common failures and what they mean:
- `502 Bad Gateway` — Ollama is not reachable. Restart it.
- `504 Gateway Timeout` — the agent hit the round-trip cap without the model producing a final answer. Usually the prompt was too vague; try one that names an explicit keyword.
- The `text` comes back but doesn't quote any of your notes — the model answered without calling `filter_notes`. Make the keyword more explicit in the prompt (e.g., *"Search the notes for the word react and quote any matches."*).

## Good luck!


