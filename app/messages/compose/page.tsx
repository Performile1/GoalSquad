'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createBrowserClient } from '@supabase/ssr';
import { SendIcon, UserIcon, BuildingIcon, UsersIcon, TruckIcon, GlobeIcon } from '@/app/components/BrandIcons';

export default function ComposeMessagePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    targetType: 'all', // all, user, class, club, warehouse, merchant, seller
    targetId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Not authenticated');
      }

      // Determine recipients based on target type
      let recipients: string[] = [];

      if (formData.targetType === 'all') {
        // Send to all users
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true);
        recipients = allUsers?.map(u => u.id) || [];
      } else if (formData.targetType === 'user' && formData.targetId) {
        recipients = [formData.targetId];
      } else if (formData.targetType === 'class' && formData.targetId) {
        // Send to all users in a specific class
        const { data: classMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'seller')
          .contains('metadata', { class_id: formData.targetId });
        recipients = classMembers?.map(u => u.id) || [];
      } else if (formData.targetType === 'club' && formData.targetId) {
        // Send to all members of a specific club/community
        const { data: clubMembers } = await supabase
          .from('profiles')
          .select('id')
          .eq('community_id', formData.targetId);
        recipients = clubMembers?.map(u => u.id) || [];
      } else if (formData.targetType === 'warehouse' && formData.targetId) {
        // Send to warehouse partner
        const { data: warehouse } = await supabase
          .from('warehouse_partners')
          .select('user_id')
          .eq('id', formData.targetId)
          .single();
        if (warehouse) recipients = [warehouse.user_id];
      } else if (formData.targetType === 'merchant' && formData.targetId) {
        // Send to merchant
        const { data: merchant } = await supabase
          .from('merchants')
          .select('user_id')
          .eq('id', formData.targetId)
          .single();
        if (merchant) recipients = [merchant.user_id];
      } else if (formData.targetType === 'seller' && formData.targetId) {
        // Send to seller
        const { data: seller } = await supabase
          .from('seller_profiles')
          .select('user_id')
          .eq('id', formData.targetId)
          .single();
        if (seller) recipients = [seller.user_id];
      }

      // Create message for each recipient
      const messagePromises = recipients.map(recipientId =>
        supabase.from('messages').insert({
          sender_id: authUser.id,
          recipient_id: recipientId,
          subject: formData.subject,
          content: formData.content,
          is_read: false,
        })
      );

      await Promise.all(messagePromises);

      router.push('/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Skicka meddelande</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Ämne
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Meddelandeämne..."
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Innehåll
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Skriv ditt meddelande..."
            />
          </div>

          {/* Target Type */}
          <div>
            <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 mb-2">
              Mottagare
            </label>
            <select
              id="targetType"
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetId: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Alla användare</option>
              <option value="user">Specifik användare</option>
              <option value="class">Klass</option>
              <option value="club">Förening/Klubb</option>
              <option value="warehouse">Lagerpartner</option>
              <option value="merchant">Företag/Merchant</option>
              <option value="seller">Säljare</option>
            </select>
          </div>

          {/* Target ID (conditional) */}
          {formData.targetType !== 'all' && (
            <div>
              <label htmlFor="targetId" className="block text-sm font-medium text-gray-700 mb-2">
                {formData.targetType === 'user' ? 'Användar-ID' :
                 formData.targetType === 'class' ? 'Klass-ID' :
                 formData.targetType === 'club' ? 'Förenings-ID' :
                 formData.targetType === 'warehouse' ? 'Lagerpartner-ID' :
                 formData.targetType === 'merchant' ? 'Företags-ID' : 'Säljar-ID'}
              </label>
              <input
                type="text"
                id="targetId"
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ID..."
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 flex items-center gap-2"
            >
              <SendIcon size={20} />
              {loading ? 'Skickar...' : 'Skicka'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
