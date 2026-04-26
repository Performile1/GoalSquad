'use client';

import { useAuth } from '@/lib/auth-context';

export default function SessionLockedOverlay() {
  const { isLocked } = useAuth();

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/30 pointer-events-none z-40" />
  );
}
