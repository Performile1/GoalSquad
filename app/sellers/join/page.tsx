'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export const dynamic = 'force-dynamic'

function SellerJoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const communityId = searchParams.get('community')
  const inviteCode = searchParams.get('code')

  const { user, signUp, signInWithOAuth } = useAuth()

  const [community, setCommunity] = useState<{ name: string; logoUrl?: string } | null>(null)
  const [step, setStep] = useState<'info' | 'account' | 'done'>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!communityId) return
    fetch(`/api/communities/${communityId}/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setCommunity({ name: d.name, logoUrl: d.logo_url })
      })
      .catch(() => {})
  }, [communityId])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp(form.email, form.password, form.fullName)
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Registrering misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-900 font-semibold hover:text-primary-600 mb-8 transition"
        >
          ← Till GoalSquad
        </Link>

        {/* Community header */}
        {community && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-primary-50 border border-primary-200 rounded-2xl px-6 py-4 mb-6"
          >
            {community.logoUrl ? (
              <img src={community.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary-900 flex items-center justify-center text-white font-extrabold text-xl">
                {community.name[0]}
              </div>
            )}
            <div>
              <p className="text-xs text-primary-700 font-semibold uppercase tracking-wider">Du är inbjuden av</p>
              <p className="text-lg font-extrabold text-primary-900">{community.name}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Step: Info */}
          {step === 'info' && (
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🏆</div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                  Bli säljare på GoalSquad
                </h1>
                <p className="text-gray-500 leading-relaxed">
                  Sälj produkter, stöd din förening och tjäna din del av intäkterna — allt via din telefon.
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  { icon: '📦', text: 'Välj produkter och dela din personliga länk' },
                  { icon: '💸', text: 'Du tjänar en del av varje försäljning' },
                  { icon: '🏅', text: 'Tävla med dina lagkamrater på leaderboardet' },
                  { icon: '🚚', text: 'Vi sköter leverans och kundtjänst' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <span className="text-sm text-gray-600 leading-snug">{item.text}</span>
                  </li>
                ))}
              </ul>

              {user ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition"
                >
                  Gå till min sida →
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('account')}
                    className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition"
                  >
                    Skapa konto &amp; börja sälja →
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">eller</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <button
                    onClick={() => signInWithOAuth('google')}
                    className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    Fortsätt med Google
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Har du konto?{' '}
                    <Link href={`/auth/login?next=/sellers/join${communityId ? `?community=${communityId}` : ''}`} className="text-primary-900 font-semibold hover:underline">
                      Logga in
                    </Link>
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step: Create account */}
          {step === 'account' && (
            <>
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">Skapa ditt konto</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">För- och efternamn *</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    placeholder="Anna Andersson"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">E-postadress *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="anna@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lösenord *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Minst 8 tecken"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-primary-300 transition"
                  >
                    ← Tillbaka
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-900 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Skapar...' : 'Skapa konto →'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Välkommen till GoalSquad!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Ditt konto är skapat. Kontrollera din e-post för att bekräfta kontot och börja sälja.
              </p>
              <Link
                href="/dashboard"
                className="block w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition text-center"
              >
                Gå till min sida →
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}

import { Suspense } from 'react'

export default function SellerJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Laddar...</div></div>}>
      <SellerJoinContent />
    </Suspense>
  )
}
