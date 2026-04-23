'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MerchantIcon, ShopIcon } from '@/app/components/BrandIcons'

export default function MerchantOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState<'info' | 'verify'>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpHash, setOtpHash] = useState('')
  const [merchantId, setMerchantId] = useState('')

  const [formData, setFormData] = useState({
    merchantName: '',
    slug: '',
    description: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'NO',
    legalName: '',
    orgNumber: '',
    vatNumber: '',
    verificationMethod: 'otp_email' as 'otp_email' | 'otp_sms',
  })

  const [otp, setOtp] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Mock user ID (in production, get from auth)
      const userId = '00000000-0000-0000-0000-000000000002'

      const response = await fetch('/api/merchants/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          ipAddress: '127.0.0.1', // In production, get from request
          userAgent: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to onboard merchant')
      }

      setOtpHash(data.verification.otpHash)
      setMerchantId(data.merchant.id)
      setStep('verify')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userId = '00000000-0000-0000-0000-000000000002'

      const response = await fetch('/api/merchants/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          otp,
          otpHash,
          userId,
          email: formData.email,
          phone: formData.phone,
          verificationMethod: formData.verificationMethod,
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Success! Redirect to merchant dashboard
      router.push(`/merchants/${merchantId}/dashboard`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/join"
          className="inline-flex items-center gap-2 text-primary-900 font-semibold hover:text-primary-600 mb-8 transition"
        >
          ← Tillbaka
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="icon-brand"><MerchantIcon size={40} /></div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Registrera ditt företag
            </h1>
          </div>
          <p className="text-gray-500 mb-8">
            Bli Merchant på GoalSquad och nå tusentals föreningssäljare i Norden.
          </p>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full transition ${step === 'info' ? 'bg-primary-900' : 'bg-primary-900'}`} />
            <div className={`flex-1 h-2 rounded-full transition ${step === 'verify' ? 'bg-primary-900' : 'bg-gray-200'}`} />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {step === 'info' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Företagets namn *
                </label>
                <input
                  type="text"
                  required
                  value={formData.merchantName}
                  onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  placeholder="T.ex. Sport &amp; Fritid AB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Butiks-URL *
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">goalsquad.shop/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    placeholder="ditt-foretag"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-post *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  placeholder="info@dittforetag.se"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  placeholder="+46 70 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adress *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition mb-3"
                  placeholder="Gatuadress"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    placeholder="Postnummer"
                  />
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    placeholder="Stad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verifieringsmetod *
                </label>
                <select
                  value={formData.verificationMethod}
                  onChange={(e) => setFormData({ ...formData, verificationMethod: e.target.value as 'otp_email' | 'otp_sms' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                >
                  <option value="otp_email">Via e-post</option>
                  <option value="otp_sms">Via SMS</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Behandlar...' : 'Fortsätt till verifiering →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4"><ShopIcon size={48} /></div>
                <p className="text-gray-700">
                  Vi har skickat en verifieringskod till{' '}
                  <strong>
                    {formData.verificationMethod === 'otp_email' ? formData.email : formData.phone}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verifieringskod
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Verifierar...' : 'Verifiera &amp; slutför →'}
              </button>

              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-full text-gray-500 hover:text-primary-900 transition font-medium"
              >
                ← Tillbaka till formuläret
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
