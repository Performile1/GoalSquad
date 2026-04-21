'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckIcon, DashboardIcon } from '@/app/components/BrandIcons';

export default function AdPurchaseSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckIcon size={40} className="text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Annons Skapad!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Din annons har skapats och väntar nu på godkännande från administratören. Du kommer att få ett meddelande när den har granskats.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600">
            <strong>Nästa steg:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 text-left">
            <li>• Administratören granskar din annons</li>
            <li>• Du får ett meddelande vid godkännande</li>
            <li>• Annonsen visas när den är aktiv</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/ads/my-ads"
            className="block w-full px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
          >
            Mina Annonser
          </Link>
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Till Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
