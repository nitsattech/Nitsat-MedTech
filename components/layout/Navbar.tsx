'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';

interface User {
  role?: string;
  email?: string;
}

const getUserFromCookies = () => {
  if (typeof document === 'undefined') return {};

  const role = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userRole='))
    ?.split('=')[1];

  const email = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userEmail='))
    ?.split('=')[1];

  return { role, email };
};

export default function Navbar() {

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getUserFromCookies();
    setUser(u);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center">

      <div className="flex items-center gap-4">

        <h1
          className="text-xl font-bold cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          Nitsat MedTech
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Button>

      </div>

      <div className="flex items-center gap-4">

        {user && (
          <span className="text-sm text-gray-600">
            {decodeURIComponent(user.email || '')} ({user.role})
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-red-500"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>

      </div>

    </header>
  );
}