'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  FolderIcon,
  BellIcon,
  ShoppingBagIcon,
  StarIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || (session.user as CustomUser).role !== 'admin') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  async function fetchUnreadCount() {
    try {
      const res = await fetch('/api/comments?unread=true&count=true');
      if (res.ok) {
        const data = await res.json();
        // Check if response has success flag (new format) or just count (old format)
        if (data.success && typeof data.count === 'number') {
          setUnreadCount(data.count);
        } else if (typeof data.count === 'number') {
          // Fallback for backward compatibility
          setUnreadCount(data.count);
        }
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/admin/projects', icon: FolderIcon },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: BellIcon,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { name: 'Purchases', href: '/admin/purchases', icon: ShoppingBagIcon },
    { name: 'Reviews', href: '/admin/reviews', icon: StarIcon },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  ];

  const handleLogout = async () => {
    router.push('/api/auth/signout');
  };

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="rounded-md p-4 max-w-sm w-full">
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-4">
              <div className="rounded-full bg-indigo-400 dark:bg-indigo-600 h-12 w-12"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-indigo-400 dark:bg-indigo-600 rounded w-3/4"></div>
                <div className="h-4 bg-indigo-400 dark:bg-indigo-600 rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-4 bg-indigo-400 dark:bg-indigo-600 rounded w-full"></div>
            <div className="h-4 bg-indigo-400 dark:bg-indigo-600 rounded w-full"></div>
            <div className="h-4 bg-indigo-400 dark:bg-indigo-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user || (session.user as CustomUser).role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center h-16 px-4">
          <button
            type="button"
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <button
            type="button"
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            onClick={toggleTheme}
          >
            {mounted && (
              theme === 'dark' ? <MoonIcon className="h-6 w-6" /> :
              theme === 'light' ? <SunIcon className="h-6 w-6" /> :
              <ComputerDesktopIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.3 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                      >
                        <item.icon
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-3 inline-flex items-center rounded-full bg-indigo-600 dark:bg-indigo-500 px-2.5 py-0.5 text-xs font-medium text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-500 dark:to-blue-400 flex items-center justify-center text-white font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-800 dark:text-white">{session.user.name}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-auto flex items-center justify-center h-9 w-9 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
          <div className="flex flex-col w-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center h-16 px-4 flex-shrink-0 justify-between">
              {!isCollapsed && (
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              )}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`${isCollapsed ? 'mx-auto' : 'ml-auto'} p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none`}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition duration-200 ease-in-out ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      <item.icon
                        className={`${isCollapsed ? 'mr-0 mx-auto' : 'mr-3'} h-6 w-6 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <span className="flex-1">{item.name}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span className="ml-3 inline-flex items-center rounded-full bg-indigo-600 dark:bg-indigo-500 px-2.5 py-0.5 text-xs font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                      {isCollapsed && item.badge && (
                        <span className="absolute top-1 right-1 inline-flex items-center rounded-full bg-indigo-600 dark:bg-indigo-500 w-4 h-4 text-xs font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className={`flex ${isCollapsed ? 'flex-col items-center' : 'items-center'}`}>
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-500 dark:to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                    {session.user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="ml-3 flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{session.user.name}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Admin</p>
                  </div>
                )}

                <div className={`flex ${isCollapsed ? 'mt-2' : 'ml-auto'} items-center space-x-2`}>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                    aria-label="Toggle theme"
                  >
                    {mounted && (
                      theme === 'dark' ? <MoonIcon className="h-5 w-5" /> :
                      theme === 'light' ? <SunIcon className="h-5 w-5" /> :
                      <ComputerDesktopIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                    aria-label="Logout"
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto relative bg-gray-50 dark:bg-gray-900">
          {/* Mobile top navigation */}
          <div className="lg:hidden h-16"></div>
          
          <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}