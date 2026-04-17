'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShareIcon, MessageIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon } from '@/components/BrandIcons';

export const dynamic = 'force-dynamic';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [customText, setCustomText] = useState('');
  const [sellerLink, setSellerLink] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/sellers/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setSellerLink(`https://goal-squad.vercel.app/seller/${user.id}`);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getShareMessage = () => {
    const defaultMessage = 'Hej! Jag säljer produkter för att stödja min förening. Titta gärna på min shop:';
    return customText ? `${customText}\n\n${defaultMessage}` : defaultMessage;
  };

  const shareViaFacebook = () => {
    const message = getShareMessage();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sellerLink)}&quote=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaInstagram = () => {
    navigator.clipboard.writeText(`${getShareMessage()}\n\n${sellerLink}`);
    alert('Länk kopierad! Klistra in den i din Instagram Story eller post.');
  };

  const shareViaMessenger = () => {
    const message = getShareMessage();
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(sellerLink)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(sellerLink)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const message = getShareMessage();
    const subject = 'Titta på min shop hos GoalSquad';
    const body = `${message}\n\n${sellerLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const message = getShareMessage();
    const body = `${message}\n\n${sellerLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(sellerLink);
    alert('Länk kopierad!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Säljar-dashboard</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dela din shop</h2>
          <p className="text-gray-600 mb-6">Dela din personliga shop via olika kanaler för att nå fler kunder.</p>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lägg till personligt meddelande (valfritt)</label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Lägg till ett personligt meddelande..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            />
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Din personliga länk</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sellerLink}
                readOnly
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-700"
              />
              <button
                onClick={copyLink}
                className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-600 transition flex items-center gap-2"
              >
                <ShareIcon size={20} />
                Kopiera
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={shareViaFacebook}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <FacebookIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">Facebook</span>
            </button>
            <button
              onClick={shareViaInstagram}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <InstagramIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">Instagram</span>
            </button>
            <button
              onClick={shareViaMessenger}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <MessageIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">Messenger</span>
            </button>
            <button
              onClick={shareViaEmail}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <MailIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">E-post</span>
            </button>
            <button
              onClick={shareViaSMS}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <PhoneIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">SMS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
