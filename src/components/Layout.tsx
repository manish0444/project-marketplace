'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Determine if sidebar should be shown on this path
  const shouldShowSidebar = pathname === '/' || pathname.startsWith('/projects');

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 dark:text-white text-gray-900">
      {shouldShowSidebar && (
        <>
          {/* Static Sidebar for desktop */}
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          />

          {/* Mobile Sidebar */}
          <Sidebar 
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Mobile menu button */}
          <div className="md:hidden fixed top-4 left-4 z-40">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md dark:text-gray-300 text-gray-700 hover:dark:bg-gray-800 hover:bg-gray-200 dark:hover:text-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 focus:ring-offset-white focus:ring-offset-2 transition-colors duration-150 bg-white dark:bg-gray-900 shadow-md"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {/* Main content - adjust padding based on sidebar visibility */}
      <div className={`flex flex-col flex-1 ${shouldShowSidebar && !isSidebarCollapsed ? 'md:pl-64' : shouldShowSidebar && isSidebarCollapsed ? 'md:pl-20' : ''}`}>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
