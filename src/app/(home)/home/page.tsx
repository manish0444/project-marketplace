'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Project } from '@/types/project';
import ProjectCard from '@/components/ProjectCard';
import { 
  ArrowRightIcon, 
  SparklesIcon, 
  CodeBracketIcon, 
  ShoppingCartIcon, 
  StarIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  CubeIcon,
  RocketLaunchIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Fetch projects function
async function getProjects(): Promise<{ projects: Project[]; error?: string }> {
  return fetch('/api/projects', {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      return res.json();
    })
    .then((projects) => ({ projects }))
    .catch((error) => {
      console.error('Error fetching projects:', error);
      return { 
        projects: [],
        error: 'Failed to load projects. Please try again later.' 
      };
    });
}

// Categories for the showcase
const categories = [
  { name: 'Web Applications', icon: CodeBracketIcon },
  { name: 'Mobile Apps', icon: CodeBracketIcon },
  { name: 'UI/UX Templates', icon: CodeBracketIcon },
  { name: 'E-commerce', icon: ShoppingCartIcon },
  { name: 'AI Solutions', icon: SparklesIcon },
];

// Navigation items
const navigationItems = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/projects' },
  { name: 'Categories', href: '/categories', children: [
    { name: 'Web Applications', href: '/categories/web-applications' },
    { name: 'Mobile Apps', href: '/categories/mobile-apps' },
    { name: 'UI/UX Templates', href: '/categories/ui-ux-templates' },
    { name: 'E-commerce', href: '/categories/e-commerce' },
    { name: 'AI Solutions', href: '/categories/ai-solutions' },
  ]},
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
];

// Footer links
const footerLinks = {
  marketplace: [
    { name: 'All Projects', href: '/projects' },
    { name: 'Featured', href: '/projects/featured' },
    { name: 'Latest', href: '/projects/latest' },
    { name: 'Popular', href: '/projects/popular' },
  ],
  categories: [
    { name: 'Web Applications', href: '/categories/web-applications' },
    { name: 'Mobile Apps', href: '/categories/mobile-apps' },
    { name: 'UI/UX Templates', href: '/categories/ui-ux-templates' },
    { name: 'E-commerce', href: '/categories/e-commerce' },
    { name: 'AI Solutions', href: '/categories/ai-solutions' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
  account: [
    { name: 'Sign In', href: '/auth/signin' },
    { name: 'Sign Up', href: '/auth/signup' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Sell Projects', href: '/dashboard/projects/new' },
    { name: 'Settings', href: '/dashboard/settings' },
  ],
};

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  
  // Header scroll effect
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch projects on component mount
  useEffect(() => {
    setIsLoading(true);
    getProjects()
      .then(({ projects, error }) => {
        if (projects.length > 0) {
          setProjects(projects);
          // Select featured projects (first 3)
          setFeaturedProjects(projects.slice(0, 3));
        }
        if (error) setError(error);
        setIsLoading(false);
      });
  }, []);

  // Toggle dropdown menu
  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                PS
              </div>
              <span className={`font-bold text-xl ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
                ProjectShowcase
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative group">
                  {item.children ? (
                    <button 
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center space-x-1 font-medium ${scrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white'} hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors`}
                    >
                      <span>{item.name}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link 
                      href={item.href}
                      className={`font-medium ${scrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white'} hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors`}
                    >
                      {item.name}
                    </Link>
                  )}
                  
                  {/* Dropdown Menu */}
                  {item.children && (
                    <div 
                      className={`absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 transition-all duration-200 ${activeDropdown === item.name ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                    >
                      <div className="py-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
            
            {/* Search and Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className={`p-2 rounded-full ${scrolled ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-white hover:bg-white/10'} transition-colors`}>
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              
              <Link 
                href="/auth/signin"
                className={`px-4 py-2 rounded-lg ${scrolled ? 'text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-white border border-white/30 hover:bg-white/10'} transition-colors`}
              >
                Sign In
              </Link>
              
              <Link 
                href="/auth/signup"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden bg-white dark:bg-gray-900 shadow-lg"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-6 space-y-4">
                {navigationItems.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <>
                        <button 
                          onClick={() => toggleDropdown(item.name)}
                          className="flex items-center justify-between w-full py-2 text-gray-700 dark:text-gray-300"
                        >
                          <span>{item.name}</span>
                          <ChevronDownIcon className={`h-4 w-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === item.name && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-4 space-y-2 mt-2"
                            >
                              {item.children.map((child) => (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className="block py-2 text-gray-600 dark:text-gray-400"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link 
                        href={item.href}
                        className="block py-2 text-gray-700 dark:text-gray-300"
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <Link 
                    href="/auth/signin"
                    className="block w-full py-2 text-center rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                  >
                    Sign In
                  </Link>
                  
                  <Link 
                    href="/auth/signup"
                    className="block w-full py-2 text-center rounded-lg bg-indigo-600 text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* Hero Section */}
      <div ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background gradient and particles */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-purple-900/20 to-transparent dark:from-indigo-950/40 dark:via-purple-950/40 z-0"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/10"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0.8, 1],
                opacity: [0, 0.2, 0.1, 0],
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        {/* 3D Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl"
            style={{ top: '20%', left: '15%' }}
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-pink-500/20 to-indigo-500/20 blur-2xl"
            style={{ bottom: '10%', right: '10%' }}
            animate={{
              y: [0, -40, 0],
              x: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        {/* Hero content */}
        <motion.div 
          className="container mx-auto px-4 z-10 text-center"
          style={{ y, opacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100/80 dark:bg-indigo-900/80 backdrop-blur-sm text-indigo-800 dark:text-indigo-200 text-sm font-medium mb-6"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Premium Digital Projects Marketplace
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="block">Discover Exceptional</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Digital Masterpieces
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Explore and purchase high-quality digital projects, templates, and software solutions from talented creators around the world.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/projects" className="px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/30">
              Explore Projects
            </Link>
            <Link href="/auth/signin" className="px-8 py-4 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-medium hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg">
              Sign In
            </Link>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
          >
            <div className="w-8 h-12 rounded-full border-2 border-gray-400 dark:border-gray-600 flex justify-center pt-2">
              <motion.div 
                className="w-1 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Featured Projects Section */}
      <div ref={featuredRef} className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm font-medium mb-4"
            >
              <StarIcon className="h-4 w-4 mr-2" />
              Handpicked Selection
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Featured Projects
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Discover outstanding digital projects that stand out from the crowd
            </motion.p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:bg-red-950/30 bg-red-50 p-4 rounded-lg">
              {error}
            </div>
          ) : featuredProjects.length === 0 ? (
            <div className="text-center dark:text-gray-400 text-gray-500 p-10 rounded-lg dark:bg-gray-800/50 bg-gray-100/50">
              No projects available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="h-full"
                >
                  <ProjectCard project={project} index={index} />
                </motion.div>
              ))}
            </div>
          )}
          
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link 
              href="/projects" 
              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              View all projects
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm font-medium mb-4"
            >
              <RocketLaunchIcon className="h-4 w-4 mr-2" />
              Why Choose This Marketplace
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Premium Features
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              The ultimate destination for high-quality digital projects
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CubeIcon,
                title: "Curated Collection",
                description: "Every project is carefully reviewed to ensure the highest quality standards before being listed on the marketplace."
              },
              {
                icon: ShoppingCartIcon,
                title: "Secure Transactions",
                description: "All purchases are protected with secure payment processing and satisfaction guarantee for peace of mind."
              },
              {
                icon: UserGroupIcon,
                title: "Creator Support",
                description: "Direct communication with project creators for customization requests and technical support."
              },
              {
                icon: GlobeAltIcon,
                title: "Global Marketplace",
                description: "Access to projects from talented creators around the world, bringing diverse perspectives and solutions."
              },
              {
                icon: SparklesIcon,
                title: "Exclusive Content",
                description: "Many projects are exclusively available on this marketplace, giving you access to unique digital assets."
              },
              {
                icon: CodeBracketIcon,
                title: "Code Quality",
                description: "All code-based projects undergo technical review to ensure clean, well-documented, and efficient implementation."
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Categories Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm font-medium mb-4"
            >
              <CubeIcon className="h-4 w-4 mr-2" />
              Browse By Category
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Project Categories
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Find exactly what you're looking for from the diverse collection
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                  <category.icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Explore {category.name.toLowerCase()} from our talented creators
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Projects', value: '100+' },
              { label: 'Creators', value: '50+' },
              { label: 'Categories', value: '10+' },
              { label: 'Happy Customers', value: '500+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-indigo-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Showcase Your Project?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Join our community of creators and showcase your digital masterpieces to the world.
            </p>
            <Link 
              href="/auth/signup" 
              className="px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-indigo-500/30"
            >
              Get Started Today
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              What Our Users Say
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Hear from our satisfied customers and creators
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Alex Johnson',
                role: 'Web Developer',
                content: 'This platform has been a game-changer for my business. I\'ve been able to showcase my projects to a wider audience and connect with clients from around the world.',
                avatar: '/images/avatar-1.jpg'
              },
              {
                name: 'Sarah Williams',
                role: 'UI/UX Designer',
                content: 'The quality of projects on this platform is outstanding. I\'ve found incredible templates that have saved me countless hours of work.',
                avatar: '/images/avatar-2.jpg'
              },
              {
                name: 'Michael Chen',
                role: 'Startup Founder',
                content: 'We found our development team through this platform. The project showcase made it easy to evaluate their skills and previous work.',
                avatar: '/images/avatar-3.jpg'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-4">
                    <StarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Newsletter Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-8 md:p-12 border border-indigo-100 dark:border-indigo-800/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Stay Updated
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Subscribe to our newsletter for the latest projects and updates
              </p>
            </div>
            
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}