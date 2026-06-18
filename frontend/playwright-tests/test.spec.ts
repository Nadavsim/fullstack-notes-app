import { test, expect } from '@playwright/test';

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
// HW2 CARRY-OVER TESTS (Now they will work because we are logged in!)
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
  // We are already logged in from the beforeEach block!
  
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