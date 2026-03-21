import { Page } from '@playwright/test';

export const BASE = 'http://localhost:4200';
export const API  = 'http://localhost:3000/api';

export const TEST_USERS = {
  admin:    { email: 'pw_admin@pulseops.dev',  password: 'Admin@Test123!',    name: 'PW Admin',    role: 'admin'    },
  engineer: { email: 'pw_eng@pulseops.dev',    password: 'Engineer@Test123!', name: 'PW Engineer', role: 'engineer' },
  viewer:   { email: 'pw_viewer@pulseops.dev', password: 'Viewer@Test123!',   name: 'PW Viewer',   role: 'viewer'   },
};

export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string,
  role: string
) {
  await page.goto('/auth/login');
  await page.locator('.toggle-btn', { hasText: 'Register' }).click();
  await page.locator('input[autocomplete="name"]').fill(name);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('select').selectOption(role);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await logout(page);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.locator('.logout-btn').click();
  await page.waitForURL('**/auth/login', { timeout: 10000 });
}