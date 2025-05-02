'use client';

import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Menu, Transition } from '@headlessui/react';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  CheckIcon,
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
 
 
} from '@heroicons/react/24/outline';
import {PanelsTopLeftIcon} from 'lucide-react'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type SortOption = 'newest' | 'oldest' | 'popular' | 'price-low' | 'price-high';
type ProjectType = string;

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ 
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [projectTypes, setProjectTypes] = useState<string[]>(['All']);
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Close mobile sidebar when path changes
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  // Fetch project types on mount
  useEffect(() => {
    async function fetchProjectTypes() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projects = await response.json();
          
          // Extract unique project types
          const types = new Set<string>();
          projects.forEach((project: any) => {
            if (project.projectType) {
              types.add(project.projectType);
            }
          });
          
          // Add 'All' option and convert to array
          const typeArray = ['All', ...Array.from(types)];
          setProjectTypes(typeArray);
        }
      } catch (error) {
        console.error('Error fetching project types:', error);
      }
    }
    
    fetchProjectTypes();
  }, []);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
  ];

  // Determine if user is admin
  const isAdmin = session?.user?.role === 'admin';
  
  // Get dashboard link based on role
  const dashboardLink = isAdmin ? '/admin/dashboard' : '/dashboard';
  const dashboardText = isAdmin ? 'Admin Dashboard' : 'Dashboard';
  const dashboardIcon = isAdmin ? ShieldCheckIcon : UserIcon;

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    // Apply filter directly using DOM
    const projectCards = document.querySelectorAll('[data-project-type]');
    let visibleCount = 0;
    
    projectCards.forEach(card => {
      const cardElement = card as HTMLElement;
      const projectType = cardElement.dataset.projectType;
      
      if (category === 'All' || (projectType && projectType === category)) {
        cardElement.style.display = '';
        visibleCount++;
      } else {
        cardElement.style.display = 'none';
      }
    });
    
    console.log(`Filtered to ${category}: ${visibleCount} projects visible`);
  };

  const handleSortChange = (sort: SortOption) => {
    setSelectedSort(sort);
    if (window.handleSortChange) {
      window.handleSortChange(sort);
    }
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    if (window.handleSearchChange) {
      window.handleSearchChange(search);
    }
  };

  // Show the correct theme icon based on current theme
  const ThemeIcon = !mounted ? null : 
    theme === 'dark' ? MoonIcon : 
    theme === 'light' ? SunIcon : 
    ComputerDesktopIcon;

  // Theme options for dropdown
  const themeOptions = [
    { name: 'Light', value: 'light', icon: SunIcon },
    { name: 'Dark', value: 'dark', icon: MoonIcon },
    { name: 'System', value: 'system', icon: ComputerDesktopIcon }
  ];
  
  // Get current theme text for display
  const getCurrentThemeText = () => {
    if (!mounted) return 'Theme';
    return theme === 'dark' ? 'Dark' : 
           theme === 'light' ? 'Light' : 'System';
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col dark:bg-gray-900 bg-white border-r dark:border-gray-800 border-gray-200 transition-all duration-300 ease-in-out ${isCollapsed && !isMobile ? 'md:w-20' : 'w-full md:w-64'}`}>
      {/* Header with Logo and Collapse button */}
      <div className="p-4 flex items-center justify-between border-b dark:border-gray-800 border-gray-200">
      
        
        {/* Collapse toggle button - only visible on desktop */}
        {onToggleCollapse && !isMobile && (
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center p-1 rounded-full dark:text-gray-400 text-gray-500 hover:dark:bg-gray-800 hover:bg-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelsTopLeftIcon className="h-6 w-6" />
            ) : (
              <PanelsTopLeftIcon className="h-6 w-6" />
            )}
          </button>
        )}
        
        {/* Mobile close button */}
        {onMobileClose && isMobile && (
          <button 
            onClick={onMobileClose}
            className="flex items-center justify-center p-1 rounded-full dark:text-gray-400 text-gray-500 hover:dark:bg-gray-800 hover:bg-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Main content */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin">
        {/* Home link */}
        <div>
          <Link
            href="/"
            className={classNames(
              pathname === '/' 
                ? 'dark:bg-gray-800 bg-gray-100 dark:text-white text-gray-900' 
                : 'dark:text-gray-300 text-gray-700 hover:dark:bg-gray-800 hover:bg-gray-100 hover:dark:text-white hover:text-gray-900',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150'
            )}
          >
            <HomeIcon className="h-5 w-5 flex-shrink-0" />
            {!(isCollapsed && !isMobile) && (
              <>
                <span className="ml-2">Home</span>
                {pathname === '/' && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                )}
              </>
            )}
          </Link>
        </div>

        {/* Filters - Only show on projects page */}
        {pathname === '/' && (
          <div className="space-y-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-between w-full'} px-3 py-2 text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors duration-150`}
            >
              <div className="flex items-center">
                <FunnelIcon className="h-4 w-4 flex-shrink-0" />
                {!(isCollapsed && !isMobile) && <span className="ml-2">Filters</span>}
              </div>
              {!(isCollapsed && !isMobile) && (
                <ChevronDownIcon 
                  className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? '' : 'transform rotate-180'}`} 
                />
              )}
            </button>

            {/* Animated filter content */}
            <AnimatePresence>
              {(!(isCollapsed && !isMobile) || isMobileOpen) && isFilterOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="px-3">
                      <label htmlFor="search" className="sr-only">Search</label>
                      <input
                        type="text"
                        id="search"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-md dark:bg-gray-800 bg-gray-100 dark:text-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 focus:ring-offset-white focus:ring-offset-2 transition-all duration-200"
                      />
                    </div>

                    {/* Project Types */}
                    <div className="space-y-1">
                      {!(isCollapsed && !isMobile) && (
                        <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2 px-3">Project Types</div>
                      )}
                      {projectTypes.map((type, index) => {
                        // Generate a consistent color for each project type
                        const colors = ['bg-gradient-to-r from-indigo-400 to-purple-400', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-amber-500', 'bg-teal-500', 'bg-pink-500'];
                        const colorIndex = type === 'All' ? 0 : (index % (colors.length - 1)) + 1;
                        
                        return (
                          <button
                            key={type}
                            onClick={() => handleCategoryChange(type)}
                            className={classNames(
                              selectedCategory === type ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200',
                              'group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md'
                            )}
                          >
                            <span className={`h-2 w-2 rounded-full ${colors[colorIndex]} mr-3`}></span>
                            {!(isCollapsed && !isMobile) && (
                              <>
                                <span>{type}</span>
                                {selectedCategory === type && (
                                  <span className="ml-auto">
                                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sort */}
                    <div>
                      {!(isCollapsed && !isMobile) && (
                        <h4 className="px-3 text-xs font-medium dark:text-gray-400 text-gray-500 mb-2">Sort By</h4>
                      )}
                      <div className="space-y-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={classNames(
                              selectedSort === option.value 
                                ? 'dark:bg-gray-800 bg-gray-100 dark:text-white text-gray-900' 
                                : 'dark:text-gray-400 text-gray-500 hover:dark:bg-gray-800/50 hover:bg-gray-100/50 hover:dark:text-white hover:text-gray-900',
                              'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150'
                            )}
                          >
                            {(isCollapsed && !isMobile) ? (
                              <span className="text-xs">{option.label[0]}</span>
                            ) : (
                              <>
                                <span className="flex-1 text-left">{option.label}</span>
                                {selectedSort === option.value && (
                                  option.value.includes('low') ? (
                                    <BarsArrowUpIcon className="ml-auto h-4 w-4 text-blue-500" />
                                  ) : option.value.includes('high') ? (
                                    <BarsArrowDownIcon className="ml-auto h-4 w-4 text-blue-500" />
                                  ) : (
                                    <CheckIcon className="ml-auto h-4 w-4 text-blue-500" />
                                  )
                                )}
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t dark:border-gray-800 border-gray-200">
        {session ? (
          <div className="flex flex-col space-y-3">
            {/* User info - adapts to collapsed state */}
            <div className={`flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              {!(isCollapsed && !isMobile) && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-3 overflow-hidden"
                >
                  <p className="text-sm font-medium dark:text-white text-gray-900 truncate">{session.user?.name || 'User'}</p>
                  <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{session.user?.email}</p>
                </motion.div>
              )}
            </div>
            
            {/* Dashboard, Theme Toggle and Sign Out */}
            <div className="flex flex-col space-y-2">
              {/* Dashboard link - based on role */}
              <Link
                href={dashboardLink}
                className={`flex items-center px-3 py-2 text-sm font-medium dark:text-gray-300 text-gray-700 rounded-md hover:dark:bg-gray-800 hover:bg-gray-100 transition-colors duration-150 ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
              >
                {isAdmin ? (
                  <ShieldCheckIcon className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <UserIcon className="h-4 w-4 flex-shrink-0" />
                )}
                {!(isCollapsed && !isMobile) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-2"
                  >
                    {dashboardText}
                  </motion.span>
                )}
              </Link>

              {/* Enhanced Theme Dropdown - Now opens upwards */}
              <Menu as="div" className="relative theme-dropdown">
                {({ open }) => (
                  <>
                    <Menu.Button
                      className={`flex items-center px-3 py-2 text-sm font-medium dark:text-gray-300 text-gray-700 rounded-md hover:dark:bg-gray-800 hover:bg-gray-100 transition-colors duration-150 w-full ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
                      aria-expanded={open}
                      aria-haspopup="true"
                    >
                      {ThemeIcon && <ThemeIcon className="h-4 w-4 flex-shrink-0" />}
                      {!(isCollapsed && !isMobile) && (
                        <>
                          <span className="ml-2 flex-1 text-left">{getCurrentThemeText()}</span>
                          <ChevronDownIcon 
                            className={`h-4 w-4 ml-1 transition-transform duration-200 ${open ? 'transform rotate-180' : ''}`} 
                          />
                        </>
                      )}
                    </Menu.Button>
                    
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items 
                        className={`absolute z-10 ${(isCollapsed && !isMobile) ? 'left-full ml-2 bottom-0 mb-10' : 'left-0 right-0 bottom-full mb-2'} bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden min-w-[120px]`}
                      >
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = theme === option.value;
                          return (
                            <Menu.Item key={option.value}>
                              {({ active }) => (
                                <button
                                  className={`flex items-center w-full px-3 py-2 text-sm ${
                                    active || isActive 
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                  onClick={() => setTheme(option.value)}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="ml-2">{option.name}</span>
                                  {isActive && <CheckIcon className="ml-auto h-4 w-4 text-blue-500" />}
                                </button>
                              )}
                            </Menu.Item>
                          );
                        })}
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
              
              {/* Sign out */}
              <button
                onClick={() => signOut()}
                className={`flex items-center px-3 py-2 text-sm font-medium dark:text-gray-300 text-gray-700 rounded-md hover:dark:bg-gray-800 hover:bg-gray-100 transition-colors duration-150 ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!(isCollapsed && !isMobile) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-2"
                  >
                    Sign out
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {!(isCollapsed && !isMobile) ? (
              <Link
                href="/auth/signin"
                className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-center"
              >
                Sign In
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="flex justify-center items-center h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
              >
                <UserIcon className="h-4 w-4" />
              </Link>
            )}
            
            {/* Theme Dropdown for non-authenticated users - also opens upwards */}
            <Menu as="div" className="relative theme-dropdown">
              {({ open }) => (
                <>
                  <Menu.Button
                    className={`flex items-center px-3 py-2 text-sm font-medium dark:text-gray-300 text-gray-700 rounded-md hover:dark:bg-gray-800 hover:bg-gray-100 transition-colors duration-150 w-full ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
                    aria-expanded={open}
                    aria-haspopup="true"
                  >
                    {ThemeIcon && <ThemeIcon className="h-4 w-4 flex-shrink-0" />}
                    {!(isCollapsed && !isMobile) && (
                      <>
                        <span className="ml-2 flex-1 text-left">{getCurrentThemeText()}</span>
                        <ChevronDownIcon 
                          className={`h-4 w-4 ml-1 transition-transform duration-200 ${open ? 'transform rotate-180' : ''}`} 
                        />
                      </>
                    )}
                  </Menu.Button>
                  
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items 
                      className={`absolute z-10 ${(isCollapsed && !isMobile) ? 'left-full ml-2 bottom-0 mb-10' : 'left-0 right-0 bottom-full mb-2'} bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden min-w-[120px]`}
                    >
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = theme === option.value;
                        return (
                          <Menu.Item key={option.value}>
                            {({ active }) => (
                              <button
                                className={`flex items-center w-full px-3 py-2 text-sm ${
                                  active || isActive 
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => setTheme(option.value)}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <span className="ml-2">{option.name}</span>
                                {isActive && <CheckIcon className="ml-auto h-4 w-4 text-blue-500" />}
                              </button>
                            )}
                          </Menu.Item>
                        );
                      })}
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </div>
        )}
      </div>
    </div>
  );

  // Return desktop or mobile version based on context
  return (
    <>
      {/* Desktop Sidebar - Always visible on md+ screens */}
      <div className="hidden md:flex md:flex-col md:min-h-screen md:fixed md:inset-y-0 md:z-50">
        {sidebarContent}
      </div>
      
      {/* Mobile Sidebar - Only visible when opened */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileClose}
          />
          
          {/* Sliding sidebar */}
          <motion.div 
            className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  );
}