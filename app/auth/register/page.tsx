'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken');
      return;
    }

    if (!acceptTerms) {
      setError('Du måste acceptera användarvillkoren');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        
        // If invite token, redirect to accept invitation
        if (inviteToken) {
          setTimeout(() => {
            router.push(`/invitations/accept?token=${inviteToken}`);
          }, 2000);
        } else {
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Välkommen!
          </h2>
          <p className="text-gray-600 mb-6">
            Ditt konto har skapats. Kontrollera din e-post för att verifiera ditt konto.
          </p>
          {inviteToken && (
            <p className="text-sm text-gray-500">
              Omdirigerar till inbjudan...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            GoalSquad
          </h1>
          <p className="text-primary-600">
            Skapa ditt konto
          </p>
        </div>

        {/* Invite Notice */}
        {inviteToken && (
          <div className="mb-6 p-4 bg-primary-50 border-2 border-primary-500 rounded-lg">
            <p className="text-primary-700 text-sm font-semibold">
              💌 Du har blivit inbjuden! Skapa ett konto för att acceptera.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
            <p className="text-red-700 text-sm font-semibold">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Fullständigt namn
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Anna Andersson"
              required
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              E-postadress
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.com"
              required
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 8 tecken"
              required
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary-900 mb-2">
              Bekräfta lösenord
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Skriv lösenordet igen"
              required
              className="w-full px-4 py-3 border-2 border-primary-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 accent-primary-900 rounded mt-1"
              />
              <span className="text-sm text-primary-600">
                Jag accepterar{' '}
                <Link href="/terms" className="text-primary-900 hover:text-primary-600 font-semibold">
                  användarvillkoren
                </Link>
                {' '}och{' '}
                <Link href="/privacy" className="text-primary-900 hover:text-primary-600 font-semibold">
                  integritetspolicyn
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Skapar konto...' : '✨ Skapa konto'}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Har du redan ett konto?{' '}
            <Link
              href="/auth/login"
              className="text-primary-900 hover:text-primary-600 font-bold"
            >
              Logga in här
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
