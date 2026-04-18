import { test, expect } from '@playwright/test';

// Test Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Customer login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText('Logga in');
  });

  test('Customer login with test credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Fill in login form
    await page.fill('input[type="email"]', 'customer@test.com');
    await page.fill('input[type="password"]', 'customer123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard or home
    await page.waitForURL(/\/(dashboard|account)?/, { timeout: 5000 });
    
    // Verify login was successful
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|account)/);
  });

  test('Admin login with test credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to admin dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 5000 });
    
    // Verify login was successful
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Seller login with test credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Fill in login form
    await page.fill('input[type="email"]', 'seller@test.com');
    await page.fill('input[type="password"]', 'seller123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to seller dashboard
    await page.waitForURL(/\/sellers\/dashboard/, { timeout: 5000 });
    
    // Verify login was successful
    await expect(page).toHaveURL(/\/sellers\/dashboard/);
  });

  test('Merchant login with test credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Fill in login form
    await page.fill('input[type="email"]', 'merchant@test.com');
    await page.fill('input[type="password"]', 'merchant123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to merchant dashboard
    await page.waitForURL(/\/merchants\/.*\/dashboard/, { timeout: 5000 });
    
    // Verify login was successful
    await expect(page).toHaveURL(/\/merchants\/.*\/dashboard/);
  });

  test('Customer registration page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText('Registrera');
  });

  test('Seller join page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/sellers/join`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Bli Säljare/i);
  });

  test('Community registration page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/join/community`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Registrera Förening/i);
  });

  test('Merchant registration page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/merchants/join`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Registrera Företag/i);
  });
});

test.describe('Dashboard Tests', () => {
  test('Seller dashboard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/sellers/dashboard`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Säljare Dashboard/i);
  });

  test('Merchant dashboard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/merchants/test/dashboard`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Merchant Dashboard/i);
  });

  test('Community dashboard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/communities/test/dashboard`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Dashboard/i);
  });

  test('Admin dashboard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Admin Dashboard/i);
  });
});

test.describe('Customer Account Tests', () => {
  test('Customer orders page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Mina Ordrar/i);
  });

  test('Customer gamification page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/gamification`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Gamification/i);
  });

  test('Customer discount codes page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/account/discount-codes`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Rabattkoder/i);
  });

  test('Returns page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/returns`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Returhantering/i);
  });
});

test.describe('Navigation Tests', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/GoalSquad/i);
  });

  test('Products page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Produktkatalog/i);
  });

  test('Marketplace page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Marketplace/i);
  });

  test('Communities page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/communities`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Communities/i);
  });

  test('Leaderboard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`);
    await expect(page).toHaveTitle(/GoalSquad/);
    await expect(page.locator('h1')).toContainText(/Leaderboard/i);
  });
});

test.describe('API Tests', () => {
  test('Products API responds', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('products');
  });

  test('Categories API responds', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/products/categories`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('categories');
  });

  test('Leaderboard API responds', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/leaderboard?type=sellers&period=month`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('leaderboard');
  });

  test('Communities API responds', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/communities`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('communities');
  });
});

test.describe('Navigation Links Tests', () => {
  test('Shop link navigates to products', async ({ page }) => {
    await page.goto(BASE_URL);
    const shopLink = page.getByRole('link', { name: /shop/i });
    await shopLink.click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('Communities link navigates to communities', async ({ page }) => {
    await page.goto(BASE_URL);
    const communitiesLink = page.getByRole('link', { name: /communities/i });
    await communitiesLink.click();
    await expect(page).toHaveURL(/\/communities/);
  });

  test('Leaderboard link navigates to leaderboard', async ({ page }) => {
    await page.goto(BASE_URL);
    const leaderboardLink = page.getByRole('link', { name: /leaderboard/i });
    await leaderboardLink.click();
    await expect(page).toHaveURL(/\/leaderboard/);
  });
});

test.describe('Community Messaging Tests', () => {
  test('Community messaging link exists on seller dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/sellers/dashboard`);
    const messagingLink = page.getByRole('link', { name: /Community Meddelanden/i });
    await expect(messagingLink).toBeVisible();
  });

  test('Community messaging link exists on merchant dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/merchants/test/dashboard`);
    const messagingLink = page.getByRole('link', { name: /Community Meddelanden/i });
    await expect(messagingLink).toBeVisible();
  });

  test('Community messaging link exists on admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    const messagingLink = page.getByRole('link', { name: /Community Meddelanden/i });
    await expect(messagingLink).toBeVisible();
  });

  test('Community messaging link exists on community dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/communities/test/dashboard`);
    const messagingLink = page.getByRole('link', { name: /Community Meddelanden/i });
    await expect(messagingLink).toBeVisible();
  });
});
