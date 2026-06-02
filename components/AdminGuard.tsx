'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession, touchSession } from '@/lib/admin-session';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);

  const checkSession = useCallback(() => {
    const session = getSession();
    if (!session) {
      clearSession();
      router.replace('/');
      return;
    }
    setValid(true);
  }, [router]);

  useEffect(() => {
    checkSession();
    setChecked(true);
  }, [checkSession]);

  useEffect(() => {
    if (!valid) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      touchSession();
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity));

    const interval = setInterval(() => {
      const session = getSession();
      if (!session) {
        clearSession();
        router.replace('/');
      }
    }, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [valid, router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-nature-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-nature-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!valid) return null;

  return <>{children}</>;
}
