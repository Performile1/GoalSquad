'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/app/components/ToastNotifications';

export function useRealtimeNotifications(userId?: string) {
  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  useEffect(() => {
    if (!userId) return;

    // Subscribe to order changes for this seller
    const ordersChannel = supabase
      .channel('seller-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Order paid
          if (newRecord.payment_status === 'paid' && oldRecord.payment_status !== 'paid') {
            addToastRef.current({
              type: 'sale',
              title: 'Ny försäljning!',
              message: `Order #${newRecord.id?.slice(-6)} för ${newRecord.total?.toLocaleString()} kr är betald.`,
            });
          }

          // Order ready for pickup
          if (newRecord.status === 'ready_for_pickup' && oldRecord.status !== 'ready_for_pickup') {
            addToastRef.current({
              type: 'pickup',
              title: 'Order klar för hämtning',
              message: `Order #${newRecord.id?.slice(-6)} kan nu hämtas. QR-kod genererad.`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to XP events
    const xpChannel = supabase
      .channel('xp-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_events',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as any;
          if (record.event_type === 'level_up') {
            addToastRef.current({
              type: 'levelup',
              title: 'Level up!',
              message: `Grattis! Du har nått level ${record.level || 'nya'}.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(xpChannel);
    };
  }, [userId]);
}
