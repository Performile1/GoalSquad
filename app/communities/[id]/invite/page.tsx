'use client';

import { useState } from 'react';
import { useAuth, useCommunityMember } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function InviteMemberPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { member, canInvite, loading: memberLoading } = useCommunityMember(params.id);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Bulk invite
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkMode, setBulkMode] = useState(false);

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4 animate-bounce">💌</div>
          <p className="text-xl text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user || !canInvite) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ingen behörighet
          </h2>
          <p className="text-gray-600 mb-6">
            Du har inte behörighet att bjuda in medlemmar till denna förening.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-primary-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-800"
          >
            ← Tillbaka
          </button>
        </div>
      </div>
    );
  }

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      const response = await fetch(`/api/communities/${params.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          role,
          message,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setEmail('');
        setFullName('');
        setMessage('');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Kunde inte skicka inbjudan');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    const emails = bulkEmails
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      const response = await fetch(`/api/communities/${params.id}/invite/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          role,
          message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.sent} inbjudningar skickade!`);
        setBulkEmails('');
      } else {
        const data = await response.json();
        setError(data.error || 'Kunde inte skicka inbjudningar');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          💌 Bjud in medlemmar
        </h1>

        {/* Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                !bulkMode
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Enskild inbjudan
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                bulkMode
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Massinbjudan
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
            <p className="text-green-700 font-semibold">
              ✅ Inbjudan skickad!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
            <p className="text-red-700 font-semibold">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Single Invite Form */}
        {!bulkMode ? (
          <form onSubmit={handleSingleInvite} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-postadress *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@example.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fullständigt namn
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anna Andersson"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Roll
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
              >
                <option value="member">Medlem</option>
                <option value="seller">Säljare</option>
                {member?.role === 'admin' && (
                  <>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Personligt meddelande (valfritt)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hej! Jag vill bjuda in dig till vår förening..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {sending ? 'Skickar...' : '📧 Skicka inbjudan'}
            </button>
          </form>
        ) : (
          /* Bulk Invite Form */
          <form onSubmit={handleBulkInvite} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-postadresser (en per rad) *
              </label>
              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder={'anna@example.com\nerik@example.com\nmaria@example.com'}
                rows={10}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                {bulkEmails.split('\n').filter((l) => l.trim()).length} e-postadresser
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Roll för alla
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
              >
                <option value="member">Medlem</option>
                <option value="seller">Säljare</option>
                {member?.role === 'admin' && (
                  <option value="moderator">Moderator</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meddelande (valfritt)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Välkommen till vår förening!"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {sending ? 'Skickar...' : '📧 Skicka alla inbjudningar'}
            </button>
          </form>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-primary-50 rounded-xl p-6">
          <h3 className="font-bold text-primary-900 mb-2">
            💡 Så fungerar inbjudningar
          </h3>
          <ul className="text-sm text-primary-800 space-y-2">
            <li>• Inbjudningar skickas via e-post</li>
            <li>• Mottagaren får en länk som är giltig i 7 dagar</li>
            <li>• Om mottagaren inte har konto skapas ett automatiskt</li>
            <li>• Du kan se status på inbjudningar under "Medlemmar"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
