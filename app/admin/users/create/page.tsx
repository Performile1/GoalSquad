'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserIcon, MailIcon, LockIcon, ShieldIcon } from '@/app/components/BrandIcons';

export default function AdminCreateUser() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || (profile.role !== 'gs_admin' && user.email !== 'admin@goalsquad.se')) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Misslyckades att skapa användare');
      }

      setSuccess(true);
      setFormData({ email: '', password: '', fullName: '', role: 'user' });
      
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skapa ny användare</h1>
          <p className="text-gray-600">Skapa en ny användare i systemet</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border-2 border-gray-200">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-green-800 font-semibold">Användare skapad! Omdirigerar...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fullständigt namn
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-900 transition"
                  placeholder="Ange fullständigt namn"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-post
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-900 transition"
                  placeholder="ange@exempel.se"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lösenord
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-900 transition"
                  placeholder="Minst 6 tecken"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Roll
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldIcon size={20} className="text-gray-400" />
                </div>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-900 transition appearance-none bg-white"
                >
                  <option value="user">Konsument</option>
                  <option value="merchant">Företag</option>
                  <option value="seller">Säljare</option>
                  <option value="community">Förening/Klubb</option>
                  <option value="warehouse">Lagerpartner</option>
                  <option value="gs_admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Skapar...' : 'Skapa användare'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
