'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
}

const initialFormState = {
  label: '',
  full_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  postal_code: '',
  country: 'SE',
  phone: '',
  is_default: false,
};

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/api/account/addresses');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Kunde inte hämta adresser');
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte hämta adresser');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingAddress(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAddress ? `/api/account/addresses/${editingAddress.id}` : '/api/account/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunde inte spara adress');

      resetForm();
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara adress');
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      full_name: address.full_name,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone,
      is_default: address.is_default,
    });
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    const confirmed = window.confirm('Är du säker på att du vill ta bort denna adress?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Kunde inte ta bort adress');
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ta bort adress');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${addressId}/set-default`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Kunde inte sätta som standard');
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte sätta som standard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-semibold">Laddar adresser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Adressbok</h1>
            <p className="text-sm text-muted-foreground mt-1">Hantera dina leveransadresser</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className={cn(
              'px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition',
              'hover:bg-primary/90'
            )}
          >
            + Lägg till adress
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingAddress ? 'Redigera adress' : 'Ny adress'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address-label" className="block text-sm font-semibold text-foreground mb-2">Etikett</label>
                  <input
                    id="address-label"
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="T.ex. Hem, Kontor"
                    className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-full-name" className="block text-sm font-semibold text-foreground mb-2">Fullständigt namn</label>
                  <input
                    id="address-full-name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address-line-1" className="block text-sm font-semibold text-foreground mb-2">Adressrad 1</label>
                <input
                  id="address-line-1"
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label htmlFor="address-line-2" className="block text-sm font-semibold text-foreground mb-2">Adressrad 2 (valfritt)</label>
                <input
                  id="address-line-2"
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="address-postal-code" className="block text-sm font-semibold text-foreground mb-2">Postnummer</label>
                  <input
                    id="address-postal-code"
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-city" className="block text-sm font-semibold text-foreground mb-2">Ort</label>
                  <input
                    id="address-city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-country" className="block text-sm font-semibold text-foreground mb-2">Land</label>
                  <select
                    id="address-country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="SE">Sverige</option>
                    <option value="NO">Norge</option>
                    <option value="DK">Danmark</option>
                    <option value="FI">Finland</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="address-phone" className="block text-sm font-semibold text-foreground mb-2">Telefon</label>
                <input
                  id="address-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-input bg-background rounded-lg outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 text-primary rounded"
                />
                <label htmlFor="is_default" className="text-sm text-foreground">Sätt som standardadress</label>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition"
                >
                  Spara
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
              Inga adresser sparade
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={cn(
                  'bg-card border rounded-lg p-6 shadow-sm',
                  address.is_default ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">{address.label}</span>
                      {address.is_default && (
                        <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded">Standard</span>
                      )}
                    </div>
                    <p className="text-foreground">{address.full_name}</p>
                    <p className="text-muted-foreground text-sm">
                      {address.address_line1}
                      {address.address_line2 && <>, {address.address_line2}</>}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {address.postal_code} {address.city}
                    </p>
                    <p className="text-muted-foreground text-sm">{address.country}</p>
                    <p className="text-muted-foreground text-sm">{address.phone}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="px-3 py-1 text-xs font-medium text-primary hover:text-primary/80 transition"
                      >
                        Sätt som standard
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                    >
                      Redigera
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="px-3 py-1 text-xs font-medium text-destructive hover:text-destructive/80 transition"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
