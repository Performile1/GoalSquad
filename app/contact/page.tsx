'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const contactOptions = [
  { icon: '🏢', title: 'Företag & Leverantörer', desc: 'Vill du sälja dina produkter via GoalSquad?', email: 'merchant@goalsquad.se' },
  { icon: '🏆', title: 'Föreningar & Klubbar', desc: 'Frågor om hur ni sätter igång med försäljning?', email: 'forening@goalsquad.se' },
  { icon: '🛠️', title: 'Teknisk support', desc: 'Problem med plattformen eller ditt konto?', email: 'support@goalsquad.se' },
  { icon: '📰', title: 'Press & Media', desc: 'Journalister och PR-förfrågningar', email: 'press@goalsquad.se' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold mb-4">Kontakta oss</h1>
            <p className="text-xl text-white/80">
              Vi svarar inom 24 timmar på vardagar.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Contact categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-16"
        >
          {contactOptions.map((opt, i) => (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-primary-50 border-2 border-primary-100 hover:border-primary-600 rounded-2xl p-6 transition"
            >
              <div className="text-3xl mb-3">{opt.icon}</div>
              <h3 className="font-bold text-primary-900 mb-1">{opt.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{opt.desc}</p>
              <a
                href={`mailto:${opt.email}`}
                className="text-primary-700 font-semibold text-sm hover:text-primary-900 transition"
              >
                {opt.email}
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-primary-900 mb-8 text-center">Skicka ett meddelande</h2>

          {sent ? (
            <div className="text-center py-16 bg-primary-50 rounded-2xl border-2 border-primary-200">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-primary-900 mb-2">Meddelandet skickat!</h3>
              <p className="text-gray-600">Vi återkommer inom 24 timmar.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border-2 border-primary-100 p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-primary-900 mb-2">Namn</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Anna Andersson"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-900 mb-2">E-post</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="din@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary-900 mb-2">Ämne</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Vad gäller det?"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary-900 mb-2">Meddelande</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Beskriv ditt ärende..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {loading ? 'Skickar...' : 'Skicka meddelande'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
