'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/admin-session';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.replace('/');
  };

  return (
    <main className="min-h-screen bg-nature-50">
      <header className="bg-nature-800 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-xs text-nature-200">Kelowna Wildlife Tracker</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-sm text-nature-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-nature-700"
          >
            Observations
          </Link>
          <Link
            href="/admin/export"
            className="text-sm text-nature-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-nature-700"
          >
            Province Export
          </Link>
          <Link
            href="/admin/species"
            className="text-sm text-nature-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-nature-700"
          >
            Species
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-red-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>
      {children}
    </main>
  );
}
