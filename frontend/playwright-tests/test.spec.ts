import { test, expect } from '@playwright/test';

// Test 1: Create a new note
test('Should create a new note successfully', async ({ page }) => {
  // 1. Go to the React app
  await page.goto('http://localhost:3000');

  // 2. Click the "Add new note" button
  const addButton = page.locator('button[name="add_new_note"]');
  await addButton.click();

  // 3. Verify the text input and buttons appeared
  const input = page.locator('input[name="text_input_new_note"]');
  await expect(input).toBeVisible();

  // 4. Fill in the note content
  await input.fill('This is a TDD generated note');

  // 5. Click the save button
  const saveButton = page.locator('button[name="text_input_save_new_note"]');
  await saveButton.click();

  // 6. Verify the notification area updated correctly
  const notification = page.locator('.notification');
  await expect(notification).toHaveText('Added a new note');
});

// Test 2: Read notes
test('Should read notes successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Verify that at least one note is rendered on the screen
  // We look for elements with the class "note" (as defined in the HTML requirements)
  const notes = page.locator('.note');
  
  // Wait for the first note to be visible (meaning the fetch from the backend succeeded)
  await expect(notes.first()).toBeVisible();
  
  // Verify that the count is greater than 0
  const count = await notes.count();
  expect(count).toBeGreaterThan(0);
});

// Test 3: Update a note
test('Should update a note successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 1. Find the first Edit button and click it
  const editButton = page.locator('button[data-testid^="edit-"]').first();
  await expect(editButton).toBeVisible();
  await editButton.click();

  // 2. Verify the textarea appears and fill it with new text
  const textarea = page.locator('textarea[data-testid^="text_input-"]').first();
  await expect(textarea).toBeVisible();
  await textarea.fill('This content has been updated via TDD!');

  // 3. Click the Save button for the edited note
  const saveButton = page.locator('button[data-testid^="text_input_save-"]').first();
  await saveButton.click();

  // 4. Verify the notification area updated exactly to the required text
  const notification = page.locator('.notification');
  await expect(notification).toHaveText('Note updated');
});

// Test 4: Delete a note
test('Should delete a note successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 1. Wait for the notes to load from the server and locate the first delete button
  const deleteButton = page.locator('button[data-testid^="delete-"]').first();
  await expect(deleteButton).toBeVisible();

  // 2. Click the delete button
  await deleteButton.click();

  // 3. Verify the notification area updated exactly to the required text
  const notification = page.locator('.notification');
  await expect(notification).toHaveText('Note deleted');
});