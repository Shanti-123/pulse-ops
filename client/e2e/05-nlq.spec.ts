import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helper';

const u = TEST_USERS.admin;

test.describe('NLQ', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, u.email, u.password);
    await page.locator('.sidebar').getByText('Query AI').click();
    await expect(page).toHaveURL(/nlq/);
  });

 test('NLQ-01 NLQ page loads', async ({ page }) => {
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText('PulseOps AI Query Engine')).toBeVisible();
});


  test('NLQ-02 Send button disabled when empty', async ({ page }) => {
    await expect(page.locator('.send-btn')).toBeDisabled();
  });

  test('NLQ-03 Send button enabled with text', async ({ page }) => {
    await page.locator('.chat-input').fill('test question');
    await expect(page.locator('.send-btn')).toBeEnabled();
  });

  test('NLQ-04 Ask question and get response', async ({ page }) => {
    await page.locator('.chat-input').fill('How many incidents are there?');
    await page.locator('.send-btn').click();
    await expect(page.locator('.user-bubble')).toBeVisible();
    await expect(page.locator('.typing-indicator')).toBeVisible();
    await expect(page.locator('.ai-bubble').nth(1)).toBeVisible({ timeout: 30000 });
  });

  test('NLQ-05 Enter key submits', async ({ page }) => {
    await page.locator('.chat-input').fill('How many services?');
    await page.keyboard.press('Enter');
    await expect(page.locator('.user-bubble')).toBeVisible();
    await expect(page.locator('.ai-bubble').nth(1)).toBeVisible({ timeout: 30000 });
  });

  test('NLQ-06 Click suggestion auto asks', async ({ page }) => {
    await page.locator('.suggestion-btn').first().click();
    await expect(page.locator('.user-bubble')).toBeVisible();
    await expect(page.locator('.ai-bubble').nth(1)).toBeVisible({ timeout: 30000 });
  });

  test('NLQ-07 Clear chat resets', async ({ page }) => {
    await page.locator('.chat-input').fill('test{Enter}');
    await page.locator('.chat-input').press('Enter');
    await page.locator('.ai-bubble').nth(1).waitFor({ timeout: 30000 });
    await page.getByText('↺ Clear Chat').click();
    await expect(page.locator('.user-bubble')).not.toBeVisible();
    await expect(page.getByText('PulseOps AI Query Engine')).toBeVisible();
  });

  test('NLQ-08 Character limit warning at 400+ chars', async ({ page }) => {
    await page.locator('.chat-input').fill('a'.repeat(420));
    await expect(page.locator('.char-count')).toBeVisible();
  });

  test('NLQ-09 Suggestions panel visible', async ({ page }) => {
    await expect(page.getByText('Try asking')).toBeVisible();
    await expect(page.locator('.suggestion-btn').first()).toBeVisible();
  });

// NLQ-10 — typing indicator disappears too fast, just check input is disabled
test('NLQ-10 Input disabled during loading', async ({ page }) => {
  await page.locator('.chat-input').fill('How many incidents?');
  await page.locator('.send-btn').click();
  await expect(page.locator('.chat-input')).toBeDisabled();
});


});