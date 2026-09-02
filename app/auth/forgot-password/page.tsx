'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Om adressen finns skickas en återställningslänk dit.');
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <section className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Återställ lösenord</h1>
        <p className="text-gray-600 mb-6">Ange e-postadressen för ditt konto.</p>

        {message && <p className="mb-4 p-3 rounded-lg bg-green-50 text-green-700">{message}</p>}
        {error && <p className="mb-4 p-3 rounded-lg bg-red-50 text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            E-postadress
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-900 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? 'Skickar...' : 'Skicka återställningslänk'}
          </button>
        </form>

        <Link href="/login" className="block text-center mt-6 text-primary-900 font-semibold">
          Tillbaka till inloggning
        </Link>
      </section>
    </main>
  );
}
