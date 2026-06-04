'use client';

import React, { useState, useEffect } from 'react';

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

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'SE',
    phone: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/account/addresses');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Kunde inte hämta adresser');
      setAddresses(data.addresses || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingAddress 
        ? `/api/account/addresses/${editingAddress.id}`
        : '/api/account/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunde inte spara adress');
      
      setShowForm(false);
      setEditingAddress(null);
      setFormData({
        label: '',
        full_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: 'SE',
        phone: '',
        is_default: false
      });
      
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message);
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
      is_default: address.is_default
    });
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna adress?')) return;
    
    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Kunde inte ta bort adress');
      
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${addressId}/set-default`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Kunde inte sätta som standard');
      
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Laddar adresser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Adressbok</h1>
            <p className="text-sm text-slate-500 mt-1">Hantera dina leveransadresser</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            + Lägg till adress
          </button>
        </div>

        {/* Address Form */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingAddress ? 'Redigera adress' : 'Ny adress'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Etikett</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="T.ex. Hem, Kontor"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Fullständigt namn</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Adressrad 1</label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Adressrad 2 (valfritt)</label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Postnummer</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ort</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Land</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SE">Sverige</option>
                    <option value="NO">Norge</option>
                    <option value="DK">Danmark</option>
                    <option value="FI">Finland</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label htmlFor="is_default" className="text-sm text-slate-700">Sätt som standardadress</label>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Spara
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
              Inga adresser sparade
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white border rounded-lg p-6 shadow-sm ${
                  address.is_default ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900">{address.label}</span>
                      {address.is_default && (
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">Standard</span>
                      )}
                    </div>
                    <p className="text-slate-700">{address.full_name}</p>
                    <p className="text-slate-600 text-sm">
                      {address.address_line1}
                      {address.address_line2 && <>, {address.address_line2}</>}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {address.postal_code} {address.city}
                    </p>
                    <p className="text-slate-600 text-sm">{address.country}</p>
                    <p className="text-slate-600 text-sm">{address.phone}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                      >
                        Sätt som standard
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-700 transition"
                    >
                      Redigera
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 transition"
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
