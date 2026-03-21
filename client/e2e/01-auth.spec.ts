import { test, expect } from '@playwright/test';
import { TEST_USERS, login, logout, registerUser } from './helper';

const u = TEST_USERS.admin;

test.describe('AUTH', () => {

  test('AUTH-01 Login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1.brand-name')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('AUTH-02 Empty form shows errors', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Email address is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('AUTH-03 Invalid email format', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill('notanemail');
    await page.locator('input[type="password"]').fill('Password@123!');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('AUTH-04 Wrong password shows error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill(u.email);
    await page.locator('input[type="password"]').fill('WrongPass@999!');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Incorrect email or password')).toBeVisible();
  });

  test('AUTH-05 Show hide password toggle', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input[type="password"]').fill('TestPass@123!');
    await page.locator('.eye-btn').click();
    await expect(page.locator('input[type="text"]')).toHaveValue('TestPass@123!');
    await page.locator('.eye-btn').click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

 test('AUTH-06 Register new user', async ({ page }) => {
  const ts = Date.now();
  await registerUser(
    page,
    'Test User',
    `newuser_${ts}@test.com`,
    'NewUser@123!',
    'engineer'
  );
});

  test('AUTH-07 Login valid credentials', async ({ page }) => {
    await login(page, u.email, u.password);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Command Center')).toBeVisible();
  });

  test('AUTH-08 Password strength indicator shows', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('.toggle-btn', { hasText: 'Register' }).click();
    await page.locator('input[type="password"]').fill('weak');
    await expect(page.locator('.strength-label')).toBeVisible();
    await page.locator('input[type="password"]').fill('StrongPass@123!');
    await expect(page.locator('.strength-label')).toHaveText('Very Strong');
  });

  test('AUTH-09 Register checklist items turn green', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('.toggle-btn', { hasText: 'Register' }).click();
    await page.locator('input[type="password"]').fill('Admin@123!');
    const passed = page.locator('.check-item.passed');
    await expect(passed).toHaveCount(5);
  });

  test('AUTH-10 Duplicate email shows conflict error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('.toggle-btn', { hasText: 'Register' }).click();
    await page.locator('input[autocomplete="name"]').fill('Duplicate');
    await page.locator('input[type="email"]').fill(u.email);
    await page.locator('input[type="password"]').fill(u.password);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('already exists')).toBeVisible();
  });

  test('AUTH-11 Logout redirects to login', async ({ page }) => {
    await login(page, u.email, u.password);
    await logout(page);
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('AUTH-12 Protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('AUTH-13 Already logged in redirects to dashboard', async ({ page }) => {
    await login(page, u.email, u.password);
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/dashboard/);
  });

});