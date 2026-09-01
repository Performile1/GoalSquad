// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import AddressBookPage from './page';

const mockFetch = vi.fn();

describe('AddressBookPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, addresses: [] }),
    });
    global.fetch = mockFetch as typeof fetch;
  });

  it('shows empty state when no addresses exist', async () => {
    render(<AddressBookPage />);

    await waitFor(() => {
      expect(screen.getByText('Inga adresser sparade')).toBeInTheDocument();
    });
  });

  it('allows creating a default address from the form', async () => {
    const user = userEvent.setup();

    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/account/addresses' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        }) as any;
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, addresses: [] }),
      }) as any;
    });

    render(<AddressBookPage />);

    await screen.findByRole('button', { name: /lägg till adress/i });
    await user.click(screen.getByRole('button', { name: /lägg till adress/i }));
    await user.type(screen.getByLabelText(/etikett/i), 'Hem');
    await user.type(screen.getByLabelText(/fullständigt namn/i), 'Anna Andersson');
    await user.type(screen.getByLabelText(/adressrad 1/i), 'Storgatan 12');
    await user.type(screen.getByLabelText(/postnummer/i), '111 22');
    await user.type(screen.getByLabelText(/ort/i), 'Stockholm');
    await user.type(screen.getByLabelText(/telefon/i), '+46701234567');
    await user.click(screen.getByLabelText(/sätt som standardadress/i));
    await user.click(screen.getByRole('button', { name: /spara/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/account/addresses',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
