import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helper';

const u = TEST_USERS.admin;

test.describe('INCIDENTS', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, u.email, u.password);
    await page.locator('.sidebar').getByText('Incidents').click();
    await expect(page).toHaveURL(/\/incidents$/);
  });

 // INC-01 — target h1 specifically
test('INC-01 Incidents page loads', async ({ page }) => {
  await expect(page.locator('h1')).toBeVisible();
});

// INC-02 — target pill-label class specifically
test('INC-02 Stats pills visible', async ({ page }) => {
  await expect(page.locator('.pill-label', { hasText: 'Total' })).toBeVisible();
  await expect(page.locator('.pill-label', { hasText: 'Open' })).toBeVisible();
  await expect(page.locator('.pill-label', { hasText: 'Investigating' })).toBeVisible();
  await expect(page.locator('.pill-label', { hasText: 'Resolved' })).toBeVisible();
  await expect(page.locator('.pill-label', { hasText: 'Critical' })).toBeVisible();
});

  test('INC-03 Filter by status', async ({ page }) => {
    await page.locator('.filter-select').first().selectOption('open');
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().locator('.badge-open')).toBeVisible();
    }
  });

  test('INC-04 Filter by severity', async ({ page }) => {
    await page.locator('.filter-select').nth(1).selectOption('critical');
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().locator('.badge-critical')).toBeVisible();
    }
  });

  test('INC-05 Clear filters', async ({ page }) => {
    await page.locator('.filter-select').first().selectOption('closed');
    await page.getByText('✕ Clear').click();
    await expect(page.locator('.filter-select').first()).toHaveValue('');
  });

  test('INC-06 Click row opens detail', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      await rows.first().click();
      await expect(page).toHaveURL(/\/incidents\/.+/);
      await expect(page.locator('.incident-title')).toBeVisible();
    }
  });

  test('INC-07 Incident detail tabs work', async ({ page }) => {
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await page.getByRole('button', { name: 'AI Analysis' }).click();
      await expect(page.locator('.tab.active')).toContainText('AI Analysis');
      await page.getByRole('button', { name: 'Postmortem' }).click();
      await expect(page.locator('.tab.active')).toContainText('Postmortem');
      await page.getByRole('button', { name: 'Runbook' }).click();
      await expect(page.locator('.tab.active')).toContainText('Runbook');
      await page.getByRole('button', { name: 'Overview' }).click();
      await expect(page.locator('.tab.active')).toContainText('Overview');
    }
  });

  test('INC-08 Resolve without root cause shows error', async ({ page }) => {
    await page.locator('.filter-select').first().selectOption('open');
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      const resolveBtn = page.getByText('✓ Resolve');
      if (await resolveBtn.isVisible()) {
        await resolveBtn.click();
        await page.getByText('Confirm Resolve').click();
        await expect(page.getByText('Root cause is required')).toBeVisible();
      }
    }
  });

  test('INC-09 Assign form validation', async ({ page }) => {
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      const assignBtn = page.getByText('◈ Assign');
      if (await assignBtn.isVisible()) {
        await assignBtn.click();
        await page.getByText('Assign').last().click();
        await expect(page.getByText('Please enter an assignee')).toBeVisible();
      }
    }
  });

  test('INC-10 Back button returns to list', async ({ page }) => {
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await page.getByText('← Back to Incidents').click();
      await expect(page).toHaveURL(/\/incidents$/);
    }
  });

  test('INC-11 Meta cards visible', async ({ page }) => {
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await expect(page.getByText('Triggered')).toBeVisible();
      await expect(page.getByText('Assigned To')).toBeVisible();
      await expect(page.getByText('Correlated Deployment')).toBeVisible();
    }
  });

});