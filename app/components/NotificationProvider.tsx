'use client';

import { useAuth } from '@/lib/auth-context';
import { ToastContainer, useToast } from './ToastNotifications';
import { useRealtimeNotifications } from '@/app/hooks/useRealtimeNotifications';

function NotificationInner() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  useRealtimeNotifications(user?.id);

  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

export default function NotificationProvider() {
  return <NotificationInner />;
}
