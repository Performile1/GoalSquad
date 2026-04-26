'use client';

import { useAuth } from '@/lib/auth-context';
import { AlertIcon } from './BrandIcons';

export default function SessionTimeoutWarning() {
  const { showWarning, extendSession, signOut } = useAuth();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertIcon size={24} className="text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Inaktivitetsvarning</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Du har varit inaktiv i en stund. Du kommer att loggas ut automatiskt om 1 minut om ingen aktivitet upptäcks.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={extendSession}
            className="flex-1 px-4 py-3 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
          >
            Fortsätt session
          </button>
          <button
            onClick={signOut}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            Logga ut nu
          </button>
        </div>
      </div>
    </div>
  );
}
