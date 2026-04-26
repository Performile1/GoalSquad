'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default function SuggestProductPage() {
  const { user } = useAuth();
  const [suggestionType, setSuggestionType] = useState<'product_url' | 'company' | 'product_info' | 'category'>('product_url');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    productUrl: '',
    company: '',
    productInfo: '',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionType,
          ...form,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kunde inte skicka förslag');
      }

      setSuccess(true);
      setForm({ productUrl: '', company: '', productInfo: '', category: '' });
    } catch (err: any) {
      setError(err.message || 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary-900 font-semibold hover:text-primary-600 mb-8 transition"
        >
          ← Till shoppen
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Föreslå nya produkter eller kategorier!
            </h1>
            <p className="text-gray-500">
              Saknar ni något som ni tycker borde finnas på GoalSquad? Tipsa oss så försöker vi lösa det.
            </p>
          </div>

          {success ? (
            <div className="text-center py-12">
              <div className="mb-4 text-4xl font-bold text-green-600">Tack!</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tack för ditt förslag!</h2>
              <p className="text-gray-500 mb-6">Vi kommer att granska det och återkomma.</p>
              <button
                onClick={() => setSuccess(false)}
                className="text-primary-900 font-semibold hover:text-primary-600"
              >
                Skicka ett till →
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Suggestion Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Vad vill du föreslå?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'product_url', label: 'Produkt från annan sida', icon: '' },
                      { id: 'company', label: 'Nytt företag/varumärke', icon: '' },
                      { id: 'product_info', label: 'Ny produktbeskrivning', icon: '' },
                      { id: 'category', label: 'Ny kategori', icon: '' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSuggestionType(type.id as any)}
                        className={`p-4 rounded-xl border-2 transition text-left ${
                          suggestionType === type.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="text-sm font-semibold text-gray-900">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Fields */}
                {suggestionType === 'product_url' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      URL till produktsida *
                    </label>
                    <input
                      type="url"
                      required
                      value={form.productUrl}
                      onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    />
                  </div>
                )}

                {suggestionType === 'company' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Företagsnamn *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Exempel: Nike, Adidas, etc."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    />
                  </div>
                )}

                {suggestionType === 'product_info' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Produktinformation *
                    </label>
                    <textarea
                      required
                      value={form.productInfo}
                      onChange={(e) => setForm({ ...form, productInfo: e.target.value })}
                      placeholder="Beskriv produkten du vill se i shoppen..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition resize-none"
                    />
                  </div>
                )}

                {suggestionType === 'category' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kategorinamn *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Exempel: Sportkläder, Utrustning, etc."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {loading ? 'Skickar...' : 'Skicka förslag →'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
