import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helper';

const u = TEST_USERS.admin;

test.describe('DASHBOARD', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, u.email, u.password);
  });

  test('DASH-01 Dashboard loads with greeting', async ({ page }) => {
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  });

  test('DASH-02 All stat cards visible', async ({ page }) => {
    await expect(page.getByText('Total Incidents')).toBeVisible();
    await expect(page.getByText('Open Incidents')).toBeVisible();
    await expect(page.getByText('Critical Severity')).toBeVisible();
    await expect(page.getByText('Resolved Today')).toBeVisible();
    await expect(page.getByText('Avg Resolution')).toBeVisible();
    await expect(page.getByText('Healthy Services')).toBeVisible();
  });

  test('DASH-03 Topbar shows title and time', async ({ page }) => {
    await expect(page.getByText('Command Center')).toBeVisible();
    await expect(page.locator('.time-display')).toBeVisible();
  });

test('DASH-04 Sidebar nav items visible', async ({ page }) => {
  await expect(page.locator('.sidebar .nav-label', { hasText: 'Dashboard' })).toBeVisible();
  await expect(page.locator('.sidebar .nav-label', { hasText: 'Services' })).toBeVisible();
  await expect(page.locator('.sidebar .nav-label', { hasText: 'Incidents' })).toBeVisible();
  await expect(page.locator('.sidebar .nav-label', { hasText: 'Query AI' })).toBeVisible();
});

  test('DASH-05 Dashboard nav item is active', async ({ page }) => {
    const dashNav = page.locator('.nav-item.active');
    await expect(dashNav).toContainText('Dashboard');
  });

  test('DASH-06 Sidebar navigate to Services', async ({ page }) => {
    await page.locator('.sidebar').getByText('Services').click();
    await expect(page).toHaveURL(/services/);
    const active = page.locator('.nav-item.active');
    await expect(active).toContainText('Services');
  });

  test('DASH-07 Sidebar navigate to Incidents', async ({ page }) => {
    await page.locator('.sidebar').getByText('Incidents').click();
    await expect(page).toHaveURL(/incidents/);
    const active = page.locator('.nav-item.active');
    await expect(active).toContainText('Incidents');
  });

  test('DASH-08 Sidebar navigate to Query AI', async ({ page }) => {
    await page.locator('.sidebar').getByText('Query AI').click();
    await expect(page).toHaveURL(/nlq/);
    const active = page.locator('.nav-item.active');
    await expect(active).toContainText('Query AI');
  });

  test('DASH-09 Back to Dashboard highlights correctly', async ({ page }) => {
    await page.locator('.sidebar').getByText('Services').click();
    await page.locator('.sidebar').getByText('Dashboard').click();
    await expect(page).toHaveURL(/dashboard/);
    const active = page.locator('.nav-item.active');
    await expect(active).toContainText('Dashboard');
  });

  test('DASH-10 Refresh button works', async ({ page }) => {
    await page.getByText('↻ Refresh').click();
    await expect(page.getByText('Total Incidents')).toBeVisible();
  });

  test('DASH-11 View all incidents link works', async ({ page }) => {
    await page.getByText('View all →').click();
    await expect(page).toHaveURL(/incidents/);
  });

  test('DASH-12 Manage services link works', async ({ page }) => {
    await page.getByText('Manage →').click();
    await expect(page).toHaveURL(/services/);
  });

  test('DASH-13 User info in sidebar', async ({ page }) => {
    await expect(page.locator('.user-name')).toBeVisible();
    await expect(page.locator('.user-role')).toContainText('admin');
  });

  test('DASH-14 WS status visible', async ({ page }) => {
    await expect(page.locator('.live-status')).toBeVisible();
  });

});