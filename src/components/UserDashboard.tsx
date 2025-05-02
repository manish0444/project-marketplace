'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';

interface UserProfile {
  name: string;
  email: string;
  image?: string;
}

interface Purchase {
  _id: string;
  projectId: string;
  project: {
    _id: string;
    title: string;
    price: number;
    images: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  feedback?: string;
}

export default function UserDashboard() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    image: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  // Initialize profile from session
  useEffect(() => {
    if (session && session.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || '',
      });
    }
  }, [session]);

  // Fetch user's purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoadingPurchases(true);
        const response = await fetch(`/api/purchases?email=${encodeURIComponent(session.user.email)}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.purchases)) {
            setPurchases(data.purchases);
          }
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
        toast.error('Failed to load your purchases');
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    fetchPurchases();
  }, [session]);

  // Handle profile form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      toast.error('You must be logged in to update your profile');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          currentEmail: session.user.email,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        
        // Update session with new user data
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: profile.name,
            email: profile.email,
          }
        });
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get image URL
  const getImageSrc = (path: string | undefined): string => {
    if (!path) return '/images/placeholder.png';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    if (path.startsWith('/')) return path;
    return `/${path}`;
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Tab content for the dashboard
  const tabs = [
    {
      name: 'Profile',
      content: (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900">
                <Image
                  src={profile.image || '/images/placeholder-user.png'}
                  alt={profile.name || 'User'}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            {/* Name */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isEditing 
                    ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                } transition-all dark:text-white`}
              />
            </div>
            
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isEditing 
                    ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                } transition-all dark:text-white`}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form to session values
                      if (session?.user) {
                        setProfile({
                          name: session.user.name || '',
                          email: session.user.email || '',
                          image: session.user.image || '',
                        });
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:shadow-md transition-all disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:shadow-md transition-all"
                >
                  Edit Profile
                </motion.button>
              )}
            </div>
          </form>
        </div>
      ),
    },
    {
      name: 'My Purchases',
      content: (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Purchases</h2>
          
          {isLoadingPurchases ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : purchases.length > 0 ? (
            <div className="space-y-6">
              {purchases.map((purchase) => (
                <motion.div
                  key={purchase._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Project Image */}
                    <div className="w-full md:w-1/4">
                      <div className="relative h-36 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {purchase.project?.images?.[0] ? (
                          <Image
                            src={getImageSrc(purchase.project.images[0])}
                            alt={purchase.project.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-gray-400 dark:text-gray-500">No image</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Purchase Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-3">
                        <Link
                          href={`/projects/${typeof purchase.projectId === 'string' ? purchase.projectId : 'undefined'}`}
                          className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {purchase.project && purchase.project.title ? purchase.project.title : 'Project'}
                        </Link>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {formatDate(purchase.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${purchase.project?.price ? purchase.project.price.toLocaleString() : '0'}
                        </div>
                        <div className={`
                          px-3 py-1 rounded-full text-xs font-medium 
                          ${purchase.status === 'approved' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : purchase.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          }
                        `}>
                          {purchase.status === 'approved' 
                            ? 'Approved' 
                            : purchase.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending'
                          }
                        </div>
                      </div>
                      
                      {purchase.status === 'rejected' && purchase.feedback && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 mb-3">
                          <p className="text-sm text-gray-900 dark:text-gray-300 font-medium mb-1">Feedback from admin:</p>
                          <p className="text-sm text-red-600 dark:text-red-400">{purchase.feedback}</p>
                        </div>
                      )}
                      
                      {purchase.status === 'approved' && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">Project files sent to your email</span>
                          </div>
                        </div>
                      )}
                      
                      {purchase.status === 'pending' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Your purchase is being reviewed. You will receive an email when it is approved.
                        </p>
                      )}
                      
                      <div className="mt-4">
                        <a
                          href={`/projects/${purchase.projectId}`}
                          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        >
                          View Project Details →
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Purchases Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't purchased any projects yet.</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              >
                Browse Projects
              </Link>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
        >
          My Dashboard
        </motion.h1>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>

      <div className="mt-6">
        <Tab.Group defaultIndex={0} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full py-3 text-sm font-medium leading-5 rounded-lg transition-all duration-300 ${
                    selected
                      ? 'bg-white dark:bg-gray-900 shadow-md text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.4] dark:hover:bg-gray-700/[0.5] hover:text-gray-800 dark:hover:text-white'
                  }`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-4">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className="rounded-xl focus:outline-none"
              >
                {tab.content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
