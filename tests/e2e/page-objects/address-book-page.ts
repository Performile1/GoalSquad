import type { Locator, Page } from '@playwright/test';

export interface AddressFormValues {
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export class AddressBookPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly addAddressButton: Locator;
  readonly emptyState: Locator;
  readonly formHeading: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole('heading', { name: /adressbok/i });
    this.addAddressButton = page.getByRole('button', { name: /lägg till adress/i });
    this.emptyState = page.getByText(/inga adresser sparade/i);
    this.formHeading = page.getByRole('heading', { name: /ny adress|redigera adress/i });
    this.saveButton = page.getByRole('button', { name: /spara/i });
  }

  async goto() {
    await this.page.goto('/account/addresses');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openCreateForm() {
    await this.addAddressButton.click();
    await this.formHeading.waitFor({ state: 'visible' });
  }

  async fillForm(values: AddressFormValues) {
    await this.page.getByLabel(/etikett/i).fill(values.label);
    await this.page.getByLabel(/fullständigt namn/i).fill(values.fullName);
    await this.page.getByLabel(/adressrad 1/i).fill(values.addressLine1);
    await this.page.getByLabel(/adressrad 2 \(valfritt\)/i).fill(values.addressLine2);
    await this.page.getByLabel(/postnummer/i).fill(values.postalCode);
    await this.page.getByLabel(/ort/i).fill(values.city);
    await this.page.getByLabel(/land/i).selectOption(values.country);
    await this.page.getByLabel(/telefon/i).fill(values.phone);

    const defaultCheckbox = this.page.getByLabel(/sätt som standardadress/i);
    if (values.isDefault) {
      await defaultCheckbox.check();
    } else {
      await defaultCheckbox.uncheck();
    }
  }

  async submitForm() {
    await this.saveButton.click();
  }
}
