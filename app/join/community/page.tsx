'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CommunityIcon, FlagIcon, TrophyIcon, RunnerIcon, UserIcon } from '@/app/components/BrandIcons'

const COMMUNITY_TYPES = [
  { value: 'sports_team', label: 'Idrottsförening', icon: RunnerIcon },
  { value: 'school_class', label: 'Skolklass', icon: UserIcon },
  { value: 'youth_club', label: 'Ungdomslag', icon: TrophyIcon },
  { value: 'scout_troop', label: 'Kulturförening', icon: CommunityIcon },
  { value: 'other', label: 'Annan', icon: FlagIcon },
]

const STEPS = ['Välj typ', 'Uppgifter', 'Kontakt', 'Klart']

export default function CommunityRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    communityType: '',
    name: '',
    description: '',
    city: '',
    country: 'SE',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    schoolName: '',
    grade: '',
  })

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const getHeaderForType = () => {
    const type = COMMUNITY_TYPES.find(ct => ct.value === form.communityType)
    if (!type) return 'Om er organisation'
    
    switch (type.value) {
      case 'school_class':
        return 'Om er klass'
      case 'sports_team':
        return 'Om er förening'
      case 'youth_club':
        return 'Om ert lag'
      case 'scout_troop':
        return 'Om er förening'
      case 'other':
        return 'Om er organisation'
      default:
        return 'Om er organisation'
    }
  }

  const getPlaceholderForType = () => {
    const type = COMMUNITY_TYPES.find(ct => ct.value === form.communityType)
    if (!type) return 'Berätta lite om er organisation...'
    
    switch (type.value) {
      case 'school_class':
        return 'Berätta lite om er klass...'
      case 'sports_team':
        return 'Berätta lite om er förening...'
      case 'youth_club':
        return 'Berätta lite om ert lag...'
      case 'scout_troop':
        return 'Berätta lite om er förening...'
      case 'other':
        return 'Berätta lite om er organisation...'
      default:
        return 'Berätta lite om er organisation...'
    }
  }

  const handleNext = () => {
    setError('')
    if (step === 0 && !form.communityType) {
      setError('Välj en typ för din grupp')
      return
    }
    if (step === 1) {
      if (!form.name || !form.city) {
        setError('Fyll i namn och stad')
        return
      }
      if (form.communityType === 'school_class' && (!form.schoolName || !form.grade)) {
        setError('Fyll i skolans namn och årskurs')
        return
      }
    }
    if (step === 2 && (!form.contactName || !form.contactEmail)) {
      setError('Fyll i kontaktnamn och e-post')
      return
    }
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/communities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name,
          slug:         form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description:  form.description,
          communityType: form.communityType,
          country:      form.country,
          city:         form.city,
          contactName:  form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          schoolName:   form.schoolName,
          grade:        form.grade,
          website:      form.website,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registrering misslyckades')
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/join"
          className="inline-flex items-center gap-2 text-primary-900 font-semibold hover:text-primary-600 mb-8 transition"
        >
          ← Tillbaka
        </Link>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    i < step
                      ? 'bg-primary-900 text-white'
                      : i === step
                      ? 'bg-primary-900 text-white ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded mb-4 ${i < step ? 'bg-primary-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Step 0: Choose type */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <CommunityIcon size={36} />
                <h1 className="text-2xl font-extrabold text-gray-900">Vilken typ av grupp?</h1>
              </div>
              <p className="text-gray-500 mb-8">Välj det alternativ som bäst beskriver din organisation.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMUNITY_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => set('communityType', ct.value)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 font-semibold text-left transition ${
                      form.communityType === ct.value
                        ? 'border-primary-900 bg-primary-50 text-primary-900'
                        : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <ct.icon size={24} />
                    {ct.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <FlagIcon size={36} />
                <h1 className="text-2xl font-extrabold text-gray-900">{getHeaderForType()}</h1>
              </div>
              <p className="text-gray-500 mb-8">Berätta lite om er grupp.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {form.communityType === 'school_class' ? 'Klassens namn *' : 'Namn *'}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder={form.communityType === 'school_class' ? 't.ex. 9B' : 't.ex. IFK Göteborg Junior'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    required
                  />
                </div>
                {form.communityType === 'school_class' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Skolans namn *
                      </label>
                      <input
                        type="text"
                        value={form.schoolName}
                        onChange={(e) => set('schoolName', e.target.value)}
                        placeholder="t.ex. Lundaskolan"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Årskurs *
                      </label>
                      <select
                        value={form.grade}
                        onChange={(e) => set('grade', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                        required
                      >
                        <option value="">Välj årskurs</option>
                        <option value="1">Årskurs 1</option>
                        <option value="2">Årskurs 2</option>
                        <option value="3">Årskurs 3</option>
                        <option value="4">Årskurs 4</option>
                        <option value="5">Årskurs 5</option>
                        <option value="6">Årskurs 6</option>
                        <option value="7">Årskurs 7</option>
                        <option value="8">Årskurs 8</option>
                        <option value="9">Årskurs 9</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kort beskrivning
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder={getPlaceholderForType()}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stad *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="Stockholm"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Land</label>
                    <select
                      value={form.country}
                      onChange={(e) => set('country', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    >
                      <option value="SE">Sverige</option>
                      <option value="NO">Norge</option>
                      <option value="DK">Danmark</option>
                      <option value="FI">Finland</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hemsida (valfritt)</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                    placeholder="https://dinforening.se"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <TrophyIcon size={36} />
                <h1 className="text-2xl font-extrabold text-gray-900">Kontaktuppgifter</h1>
              </div>
              <p className="text-gray-500 mb-8">Vi kontaktar er när er förening är godkänd.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kontaktperson *
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    placeholder="Anna Andersson"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-postadress *
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set('contactEmail', e.target.value)}
                    placeholder="anna@forening.se"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefon (valfritt)
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                    placeholder="+46 70 123 45 67"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="bg-primary-50 rounded-full p-6">
                  <TrophyIcon size={64} />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                Tack för er ansökan!
              </h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Vi granskar er ansökan och hör av oss till <strong>{form.contactEmail}</strong> inom 1–2 arbetsdagar.
              </p>
              <div className="space-y-3">
                <Link
                  href="/communities"
                  className="block w-full bg-primary-900 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition text-center"
                >
                  Se befintliga föreningar
                </Link>
                <Link
                  href="/"
                  className="block w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-primary-300 transition text-center"
                >
                  Tillbaka till startsidan
                </Link>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-primary-300 transition"
                >
                  ← Tillbaka
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-primary-900 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition"
                >
                  Nästa →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-primary-900 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {loading ? 'Skickar...' : 'Skicka ansökan →'}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
