'use client';

import { useAdminAuth } from '../../hooks/useAdminAuth';
import { usePathname } from 'next/navigation';

export default function AdminNavbar() {
  const { logout } = useAdminAuth();
  const pathname = usePathname();

  // Do not show navbar on the login page itself
  if (pathname === '/admin/login') {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          DEVPROXY Gatekeeper
        </h1>
        <button
          onClick={logout}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
