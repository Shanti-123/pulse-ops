
import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helper';

const u = TEST_USERS.admin;
const ts = Date.now();
const svcId = `e2e-svc-${ts}`;

test.describe('SERVICES', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, u.email, u.password);
    await page.locator('.sidebar').getByText('Services').click();
    await expect(page).toHaveURL(/services/);
  });

  test('SVC-01 Services page loads', async ({ page }) => {
    // Target h1 specifically to avoid strict mode violation
    await expect(page.locator('h1')).toBeVisible();
  });

  test('SVC-02 Register form opens and closes', async ({ page }) => {
    await page.getByText('+ Register Service').click();
    await expect(page.getByText('Register New Service')).toBeVisible();
    await page.getByText('✕ Cancel').click();
    await expect(page.getByText('Register New Service')).not.toBeVisible();
  });

  test('SVC-03 Register with empty fields shows error', async ({ page }) => {
    await page.getByText('+ Register Service').click();
    await page.getByRole('button', { name: 'Register Service' }).click();
    await expect(page.getByText('Service ID and name are required')).toBeVisible();
  });

  test('SVC-04 Register new service successfully', async ({ page }) => {
    await page.getByText('+ Register Service').click();
    await page.locator('input[placeholder="payment-service"]').fill(svcId);
    await page.locator('input[placeholder="Payment Service"]').fill('E2E Test Service');
    await page.getByRole('button', { name: 'Register Service' }).click();
    await expect(page.getByText('registered successfully')).toBeVisible();
    // Use .svc-name class to target the card heading specifically
    await expect(page.locator('.svc-name', { hasText: 'E2E Test Service' }).first()).toBeVisible();
  });

  test('SVC-05 Search filter works', async ({ page }) => {
    await page.locator('.search-input').fill(svcId);
    await page.waitForTimeout(500);
    await expect(page.locator('.svc-name', { hasText: 'E2E Test Service' }).first()).toBeVisible();
  });

  test('SVC-06 Search no results shows empty state', async ({ page }) => {
    await page.locator('.search-input').fill('xyznonexistent999');
    await expect(page.getByText('No services found')).toBeVisible();
  });

  test('SVC-07 Clear filters button works', async ({ page }) => {
    await page.locator('.search-input').fill('test');
    await expect(page.getByText('✕ Clear')).toBeVisible();
    await page.getByText('✕ Clear').click();
    await expect(page.locator('.search-input')).toHaveValue('');
  });

  test('SVC-08 Delete button visible for admin', async ({ page }) => {
    await expect(page.locator('.delete-btn').first()).toBeVisible();
  });

  test('SVC-09 Update service status', async ({ page }) => {
    // Search for our service first, then wait for it to appear
    await page.locator('.search-input').fill(svcId);
    await page.waitForTimeout(500);
    // Wait for service card to appear then select status
    await expect(page.locator('.svc-name', { hasText: 'E2E Test Service' }).first()).toBeVisible();
    await page.locator('.status-select').first().selectOption('degraded');
    await expect(page.getByText('Status updated')).toBeVisible();
  });

  test('SVC-10 Delete service', async ({ page }) => {
    await page.locator('.search-input').fill(svcId);
    await page.waitForTimeout(500);
    // Wait for service card to appear
    await expect(page.locator('.svc-name', { hasText: 'E2E Test Service' }).first()).toBeVisible();
    page.once('dialog', d => d.accept());
    await page.locator('.delete-btn').first().click();
    await expect(page.getByText('deleted')).toBeVisible();
    await expect(page.locator('.svc-name', { hasText: 'E2E Test Service' })).not.toBeVisible();
  });

});