import { expect, test } from '@playwright/test';
import { AddressBookPage } from './page-objects/address-book-page';

test.describe('Account address book', () => {
  test('renders the empty state and matches the desktop visual baseline', async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: 'user-123',
            email: 'customer@test.com',
            full_name: 'Test Customer',
            avatar_url: null,
            role: 'user',
            is_active: true,
            is_verified: true,
          },
          entities: null,
        }),
      });
    });

    await page.route('**/api/account/addresses', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, addresses: [] }),
      });
    });

    const addressPage = new AddressBookPage(page);
    await addressPage.goto();

    await expect(addressPage.pageHeading).toBeVisible();
    await expect(addressPage.emptyState).toBeVisible();
    await expect(addressPage.addAddressButton).toBeVisible();

    await expect(page).toHaveScreenshot('account-addresses-empty-state.png');
  });

  test('allows creating a default delivery address from the accessible form flow', async ({ page }) => {
    let addresses: Array<Record<string, unknown>> = [];

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: 'user-123',
            email: 'customer@test.com',
            full_name: 'Test Customer',
            avatar_url: null,
            role: 'user',
            is_active: true,
            is_verified: true,
          },
          entities: null,
        }),
      });
    });

    await page.route('**/api/account/addresses', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, addresses }),
        });
        return;
      }

      const payload = route.request().postDataJSON();
      const createdAddress = {
        id: 'addr-123',
        label: payload.label,
        full_name: payload.full_name,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2 ?? '',
        city: payload.city,
        postal_code: payload.postal_code,
        country: payload.country,
        phone: payload.phone,
        is_default: Boolean(payload.is_default),
        user_id: 'user-123',
        created_at: '2026-09-01T12:00:00.000Z',
      };

      addresses = [createdAddress];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    const addressPage = new AddressBookPage(page);
    await addressPage.goto();
    await addressPage.openCreateForm();

    await addressPage.fillForm({
      label: 'Home',
      fullName: 'Anna Andersson',
      addressLine1: 'Storgatan 12',
      addressLine2: 'Lägenhet 4',
      city: 'Stockholm',
      postalCode: '11122',
      country: 'SE',
      phone: '+46701234567',
      isDefault: true,
    });

    await expect(page.getByRole('checkbox', { name: /sätt som standardadress/i })).toBeChecked();
    await addressPage.submitForm();

    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Standard')).toBeVisible();
    await expect(page.getByText(/stockholm/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sätt som standard/i })).toHaveCount(0);
  });
});
