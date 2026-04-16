'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LaptopIcon, DashboardIcon, SearchIcon } from '@/app/components/BrandIcons';

export default function TechTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <LaptopIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Tech & Produkt</h1>
            <p className="text-xl text-white/80">
              Vi bygger plattformen som driver community commerce
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-primary-900 hover:text-primary-700 font-semibold mb-8 transition"
        >
          ← Tillbaka till Om oss
        </Link>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Vårt uppdrag</h2>
          <p className="text-gray-700 leading-relaxed">
            Vi utvecklar och underhåller GoalSquad-plattformen med fokus på stabilitet, skalbarhet och användarvänlighet. Med moderna tekniker bygger vi en plattform som gör det enkelt för föreningar att sälja produkter och för kunder att köpa.
          </p>
        </motion.div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Vad vi gör</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <DashboardIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Plattformsutveckling</h3>
              <p className="text-gray-600 text-sm">
                Bygger och förbättrar kärnplattformen med Next.js, React och TypeScript
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <SearchIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Backend & API</h3>
              <p className="text-gray-600 text-sm">
                Utvecklar säkra och skalbara API:er med Supabase och serverless functions
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <LaptopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">UI/UX Design</h3>
              <p className="text-gray-600 text-sm">
                Skapar intuitiva och tillgängliga gränssnitt som följer varumärkesriktlinjerna
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <DashboardIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">DevOps & Infrastruktur</h3>
              <p className="text-gray-600 text-sm">
                Hanterar deployment, övervakning och optimering av plattformen
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-900 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Intresserad av teknik?</h2>
          <p className="text-white/80 mb-6">
            Har du frågor om vår teknik eller vill du veta mer om hur vi jobbar?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            Kontakta Tech Teamet
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
