'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface UserMenuProps {
  userName: string;
}

export function UserMenu({ userName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    apiClient.clearTokens();
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span className="hidden sm:inline-block text-white/90">{userName}</span>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#3DDC97] flex items-center justify-center text-[#0D1117] text-sm font-medium">
          {userName.charAt(0).toUpperCase()}
        </div>
        <ChevronDown className={`h-4 w-4 text-[#8B949E] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#161B22] border border-[#30363D] rounded-lg shadow-lg py-1 z-50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="border-t border-[#30363D] my-1" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#F85149] hover:bg-[#21262D] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
