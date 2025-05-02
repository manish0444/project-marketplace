'use client';

import { useState, useEffect, useCallback } from 'react';
import CommentSection from '@/components/CommentSection';
import { Project, Purchase, Review } from '@/types/project';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeftIcon, ArrowDownTrayIcon, StarIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';

interface ProjectDetailsClientProps {
  project: Project;
  id: string;
}

export default function ProjectDetailsClient({ project, id }: ProjectDetailsClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  // Helper function to ensure image paths are properly formatted
  const getImageSrc = (path: string | undefined): string => {
    if (!path) return '/images/placeholder.jpg';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (!path.startsWith('/')) {
      return `/${path}`;
    }
    return path;
  };

  // Fetch existing purchase if user is logged in
  useEffect(() => {
    async function fetchUserPurchases() {
      if (!session) {
        setUserPurchases([]);
        setPurchaseStatus(null);
        return;
      }
      
      try {
        const response = await fetch(`/api/purchases?projectId=${id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.purchases.length > 0) {
            const currentUserPurchases = data.purchases.filter((purchase: Purchase) => {
              const purchaseUserId = typeof purchase.userId === 'object' ? purchase.userId._id : purchase.userId;
              return purchaseUserId === session.user.id;
            });
            
            setUserPurchases(currentUserPurchases);
            if (currentUserPurchases.length > 0) {
              setPurchaseStatus(currentUserPurchases[0].status);
            } else {
              setPurchaseStatus(null);
            }
          } else {
            setUserPurchases([]);
            setPurchaseStatus(null);
          }
        }
      } catch (error) {
        console.error('Error fetching purchase status:', error);
        setUserPurchases([]);
        setPurchaseStatus(null);
      }
    }
    
    fetchUserPurchases();
  }, [session, id]);
  
  // Initialize delivery email from session when component mounts
  useEffect(() => {
    if (session?.user?.email) {
      setDeliveryEmail(session.user.email);
    }
  }, [session]);

  // Fetch view count
  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        const response = await fetch(`/api/views?projectId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setViewCount(data.viewCount);
          }
        }
      } catch (error) {
        console.error('Error fetching view count:', error);
      }
    };
    
    fetchViewCount();
  }, [id]);

  // Handle dropping the payment proof image
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPaymentProof(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });
  
  // Email confirmation handler
  const handleEmailConfirmation = (confirm: boolean) => {
    setIsEmailConfirmed(confirm);
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryEmail(e.target.value);
    setIsEmailConfirmed(false);
  };

  // Submit purchase with payment proof
  const handlePurchaseSubmit = async () => {
    if (!session) {
      toast.error('Please log in to purchase this project');
      return;
    }
    
    if (!paymentProof) {
      toast.error('Please upload payment proof');
      return;
    }
    
    if (!deliveryEmail) {
      toast.error('Please provide a delivery email');
      return;
    }
    
    if (!deliveryEmail.match(/^[\w-\.]+@gmail\.com$/)) {
      toast.error('Please provide a valid Gmail address');
      return;
    }
    
    if (!isEmailConfirmed) {
      toast.error('Please confirm your delivery email');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('projectId', id);
      formData.append('paymentProof', paymentProof);
      formData.append('deliveryEmail', deliveryEmail);
      
      const response = await fetch('/api/purchases', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Purchase submitted successfully! An admin will review it shortly.');
        setPurchaseStatus('pending');
        setUserPurchases([data.purchase, ...userPurchases]);
      } else {
        toast.error(data.message || 'Failed to submit purchase');
      }
    } catch (error) {
      console.error('Error submitting purchase:', error);
      toast.error('Failed to submit purchase');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle download request
  const handleDownload = async () => {
    if (!session) {
      toast.error('Please log in to download this project');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const hasApprovedPurchase = userPurchases.some((p: Purchase) => p.status === 'approved');
      
      if (!hasApprovedPurchase) {
        try {
          const response = await fetch(`/api/purchases?projectId=${id}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.purchases.length > 0) {
              const currentUserPurchases = data.purchases.filter((purchase: Purchase) => {
                const purchaseUserId = typeof purchase.userId === 'object' ? purchase.userId._id : purchase.userId;
                return purchaseUserId === session.user.id;
              });
              
              setUserPurchases(currentUserPurchases);
              const nowHasApprovedPurchase = currentUserPurchases.some((p: Purchase) => p.status === 'approved');
              if (!nowHasApprovedPurchase) {
                toast.error('No approved purchase found. Please wait for admin approval.');
                setIsLoading(false);
                return;
              }
            } else {
              toast.error('No purchase found. Please submit a purchase first.');
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error refreshing purchases:', error);
        }
      }

      const downloadUrl = `/api/downloads?projectId=${id}&direct=true`;
      toast.success('Download starting!');
      window.location.href = downloadUrl;
      
    } catch (error) {
      console.error('Error downloading project:', error);
      toast.error('Failed to download project');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine the latest purchase and its status
  const latestPurchase = userPurchases.length > 0 ? userPurchases[0] : null;

  // Track page views
  useEffect(() => {
    const trackView = async () => {
      try {
        const deviceId = generateDeviceId();
        const response = await fetch('/api/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: id,
            deviceId
          })
        });
        
        if (!response.ok) {
          console.error('Failed to record view');
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };
    
    trackView();
  }, [id]);
  
  // Generate a simple device identifier
  const generateDeviceId = () => {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const deviceStr = `${platform}-${userAgent}-${screenWidth}x${screenHeight}-${timeZone}`;
    let hash = 0;
    for (let i = 0; i < deviceStr.length; i++) {
      const char = deviceStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/reviews?projectId=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews);
          
          if (session?.user) {
            const userReview = data.reviews.find(
              (review: Review) => 
                typeof review.userId === 'object' && 
                review.userId._id === session.user.id
            );
            if (userReview) {
              setUserReview(userReview);
              setRating(userReview.rating);
              setComment(userReview.comment);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [id, session]);
  
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Submit review
  const handleReviewSubmit = async () => {
    if (!session || !session.user) {
      toast.error('Please log in to submit a review');
      return;
    }
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      let userIdForReview = session.user.id;
      
      if (!userIdForReview && session.user.email) {
        try {
          const purchaseResponse = await fetch(`/api/purchases?email=${encodeURIComponent(session.user.email)}`);
          if (purchaseResponse.ok) {
            const purchaseData = await purchaseResponse.json();
            if (purchaseData.success && purchaseData.purchases.length > 0 && purchaseData.purchases[0].userId) {
              userIdForReview = purchaseData.purchases[0].userId;
            }
          }
        } catch (purchaseError) {
          console.error('Error finding user ID from purchases:', purchaseError);
        }
      }
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: id,
          userId: userIdForReview,
          email: session.user.email,
          rating,
          comment
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Review submitted successfully!');
        setUserReview(data.review);
        fetchReviews();
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const tabs = [
    {
      name: 'Overview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
        </svg>
      ),
      content: (
        <div className="bg-white/50 dark:bg-gray-900/50 p-3 sm:p-4 md:p-6 rounded-xl space-y-4 sm:space-y-6 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Description</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {project.description}
            </p>
          </motion.div>
    
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Technologies</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {project.technologies.map((tech) => (
                <motion.span
                  key={tech}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
    
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Features</h2>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {project.features.map((feature, index) => (
                <motion.li 
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start bg-gray-50 dark:bg-gray-700/50 p-2 sm:p-3 rounded-lg"
                >
                  <span className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
    
          {(project.demoUrl || project.githubUrl) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-3"
            >
              {project.demoUrl && (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md transition-all w-full xs:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  View Demo
                </motion.a>
              )}
              {project.githubUrl && (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md transition-all w-full xs:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  View Code
                </motion.a>
              )}
            </motion.div>
          )}
        </div>
      )
    },
    {
      name: 'Purchase',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      ),
      content: (
        <div className="bg-white/50 dark:bg-gray-900/50  rounded-xl backdrop-blur-sm">
          {project.price > 0 ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Purchase This Project</h2>
                <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">Get full access to the source code and documentation</p>
              </div>
              
              {!session ? (
                <div className="text-center p-4 sm:p-8">
                  <div className="mx-auto flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">You need to log in to purchase this project</p>
                  <Link 
                    href="/api/auth/signin"
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Log In
                  </Link>
                </div>
              ) : (
                <div className="p-3 sm:p-6">
                  {!purchaseStatus ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Payment QR Code */}
                      {project.paymentQrCode ? (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white dark:bg-gray-800 p-3 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Make Payment</h3>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">Scan this QR code to make payment</p>
                          <div className="max-w-xs mx-auto bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <Image 
                              src={getImageSrc(project.paymentQrCode)} 
                              alt="Payment QR Code"
                              width={200}
                              height={200}
                              className="mx-auto w-full max-w-[160px] sm:max-w-[200px]"
                              onError={() => setThumbnailErrors((prev) => ({ ...prev, 0: true }))}
                            />
                          </div>
                          {thumbnailErrors[0] && (
                            <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-2">
                              Unable to load payment QR code
                            </div>
                          )}
                          <div className="mt-3 sm:mt-4 bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="font-medium text-sm sm:text-base text-blue-800 dark:text-blue-200">Total: ${project.price.toLocaleString()}</p>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Make Payment</h3>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">Please send payment to our payment address</p>
                          <div className="max-w-xs mx-auto bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200">Total: ${project.price.toLocaleString()}</p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">Contact admin for payment details</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Proof Upload */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-gray-800 p-3 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="p-1.5 sm:p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Submit Payment Proof</h3>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">Upload a screenshot of your payment confirmation</p>
                        
                        {paymentProofPreview ? (
                          <div className="relative w-full h-32 sm:h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                            <Image 
                              src={paymentProofPreview} 
                              alt="Payment Proof" 
                              fill
                              className="object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProofPreview(null);
                                setPaymentProof(null);
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 sm:h-4 w-3 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div
                            {...getRootProps()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 mb-3 sm:mb-4 transition-all"
                          >
                            <input {...getInputProps()} />
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Drag and drop an image, or click to browse</p>
                          </div>
                        )}
                        
                        <div className="mb-3 sm:mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2" htmlFor="delivery-email">Delivery Email:</label>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <input 
                              type="email" 
                              id="delivery-email" 
                              value={deliveryEmail} 
                              onChange={handleEmailChange} 
                              className="block w-full p-2 sm:p-2.5 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                              placeholder="your-email@gmail.com"
                              disabled={isEmailConfirmed}
                            />
                            {!isEmailConfirmed ? (
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button" 
                                onClick={() => handleEmailConfirmation(true)} 
                                className="whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-md disabled:opacity-50 transition-all text-xs sm:text-sm mt-1 sm:mt-0"
                                disabled={!deliveryEmail || !deliveryEmail.match(/^[\w-\.]+@gmail\.com$/)}
                              >
                                Confirm
                              </motion.button>
                            ) : (
                              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-green-100 dark:border-green-800 mt-1 sm:mt-0">
                                <span className="text-green-600 dark:text-green-400 text-xs sm:text-sm">✓ Confirmed</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleEmailConfirmation(false)} 
                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                  Change
                                </button>
                              </div>
                            )}
                          </div>
                          {deliveryEmail && !deliveryEmail.match(/^[\w-\.]+@gmail\.com$/) && (
                            <p className="mt-1 text-xs sm:text-sm text-red-500">Please enter a valid Gmail address</p>
                          )}
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePurchaseSubmit}
                          disabled={!paymentProof || isLoading}
                          className={`w-full inline-flex items-center justify-center gap-1 sm:gap-2 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm transition-all ${!paymentProof || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-md'}`}
                        >
                          {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isLoading ? 'Submitting...' : 'Submit Purchase'}
                        </motion.button>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-center p-3 sm:p-6">
                      <div className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 ${purchaseStatus === 'approved' ? 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 shadow-sm' : purchaseStatus === 'rejected' ? 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/50 dark:to-red-800/50 text-red-800 dark:text-red-200 shadow-sm' : 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/50 dark:to-yellow-800/50 text-yellow-800 dark:text-yellow-200 shadow-sm'}`}>
                        {purchaseStatus === 'approved' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : purchaseStatus === 'rejected' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        <p className="font-semibold text-xs sm:text-sm">
                          {purchaseStatus === 'approved' ? 'Purchase Approved' : 
                           purchaseStatus === 'rejected' ? 'Purchase Rejected' : 
                           'Purchase Pending Approval'}
                        </p>
                      </div>
                      
                      {purchaseStatus === 'pending' && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">Your purchase is being reviewed by an admin. Please check back later.</p>
                      )}
                      
                      {purchaseStatus === 'rejected' && latestPurchase?.feedback && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2 font-medium">Feedback from admin:</p>
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{latestPurchase.feedback}</p>
                        </div>
                      )}
                      
                      {purchaseStatus === 'approved' && (
                        <div>
                          <div className="p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 mb-4 sm:mb-6">
                            <div className="flex items-center justify-center mb-3 sm:mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-green-700 dark:text-green-300 font-medium text-base sm:text-lg mb-1 sm:mb-2">Your purchase has been approved!</p>
                            <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">The project files have been sent to your delivery email address.</p>
                          </div>
                          <div className="p-3 sm:p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20 mb-4 sm:mb-6 text-left">
                            <p className="font-medium text-xs sm:text-sm text-green-700 dark:text-green-300 mb-2 sm:mb-3">Important Information:</p>
                            <ul className="list-disc list-inside text-xs sm:text-sm text-green-600 dark:text-green-400 space-y-1 sm:space-y-2">
                              <li>Please check your inbox and spam folder for the email</li>
                              <li>If you haven't received the email, please contact support</li>
                              <li>Thank you for your purchase!</li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {purchaseStatus === 'rejected' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPurchaseStatus(null)}
                          className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
                        >
                          Try Again
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/50 p-4 sm:p-6 rounded-xl inline-block mb-4 sm:mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Free Project</h3>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">This project is available for free download</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing Download...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Download Now
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      )
    },
    {
      name: 'Reviews',
      content: (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                <span className="text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
            )}
          </div>
    
          {reviews.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {reviews.map((review) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold mr-3">
                        {typeof review.userId === 'object' && review.userId.name
                          ? review.userId.name.charAt(0).toUpperCase()
                          : 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                          {typeof review.userId === 'object' && review.userId.name
                            ? review.userId.name
                            : 'Anonymous User'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
    
                    <div className="flex flex-col items-start sm:items-end">
                      <div className="flex items-center mb-1">
                        <div className="h-4 sm:h-6 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-2">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                            style={{ width: `${(review.rating / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          {review.rating}/5
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {review.rating === 1 && 'Not satisfied 😞'}
                        {review.rating === 2 && 'Could be better 🙁'}
                        {review.rating === 3 && 'Okay 😐'}
                        {review.rating === 4 && 'Good 😊'}
                        {review.rating === 5 && 'Excellent! 🤩'}
                      </div>
                    </div>
                  </div>
    
                  <p className="text-gray-700 italic whitespace-pre-line dark:text-gray-300 text-sm sm:text-base">
                    "{review.comment}"
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 sm:p-6 rounded-xl inline-block mb-4 sm:mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Be the first to share your thoughts about this project!</p>
            </div>
          )}
    
          {session && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 sm:mt-12 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Share Your Experience</h2>
              <div>
                <div className="mb-6 sm:mb-8">
                  <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Your Rating:</p>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-3 sm:p-4 rounded-lg relative mb-2 h-12 sm:h-14">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg transition-all duration-500"
                      style={{ width: `${(rating / 5) * 100}%` }}
                    ></div>
                    <div className="z-10 w-full flex justify-between">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`relative w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all text-xs sm:text-base ${
                            rating >= value
                              ? 'bg-yellow-500 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm'
                          }`}
                        >
                          {value}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="text-center text-sm sm:text-base text-gray-800 dark:text-gray-400 font-medium">
                    {rating === 0 && 'Select a rating'}
                    {rating === 1 && 'Not satisfied 😞'}
                    {rating === 2 && 'Could be better 🙁'}
                    {rating === 3 && 'Okay 😐'}
                    {rating === 4 && 'Good 😊'}
                    {rating === 5 && 'Excellent! 🤩'}
                  </div>
                </div>
    
                <div className="mb-4 sm:mb-6">
                  <label className="block text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Your Review:</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="block w-full p-3 sm:p-4 text-sm sm:text-base text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] sm:min-h-[150px] transition-all dark:bg-gray-800"
                    placeholder="Share your experience with this project..."
                  />
                </div>
    
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReviewSubmit}
                  disabled={isSubmittingReview || rating === 0 || !comment.trim()}
                  className={`w-full inline-flex items-center justify-center rounded-lg px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-sm transition-all ${
                    isSubmittingReview || rating === 0 || !comment.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-md dark:from-indigo-700 dark:to-indigo-800'
                  }`}
                >
                  {isSubmittingReview ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )
    },
    {
      name: 'Discussion',
      content: (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Discussion</h2>
          <CommentSection projectId={id} />
        </div>
      )
    },
    {
      name: 'Gallery',
      content: (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Project Gallery</h2>
          {project.images && project.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative h-64 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all"
                >
                  <Image
                    src={getImageSrc(image)}
                    alt={`Project screenshot ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Images Available</h3>
              <p className="text-gray-600 dark:text-gray-400">This project doesn't have any gallery images yet.</p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
   
    
  
    
     
        <div className="bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 from-gray-50 to-gray-100 min-h-screen py-4 sm:py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Back Link - Made more touch-friendly for mobile */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors p-2 -ml-2"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                Back to Projects
              </Link>
            </motion.div>
        
            {/* Project Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-950 rounded-xl shadow-xl overflow-hidden"
            >
              {/* Header Image - Responsive height */}
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full">
                {project.images && project.images.length > 0 && !mainImageError ? (
                  <Image
                    src={getImageSrc(project.images[0])}
                    alt={project.title}
                    fill
                    className="object-cover"
                    onError={() => setMainImageError(true)}
                    priority
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <span className="text-gray-400 dark:text-gray-500">No image available</span>
                  </div>
                )}
              </div>
        
              {/* Project Meta */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                    >
                      {project.title}
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                    >
                      ${project.price.toLocaleString()}
                    </motion.p>
                  </div>
        
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex flex-wrap gap-2 w-full md:w-auto"
                  >
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 px-3 py-1 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 shadow-sm">
                      {project.projectType}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 px-3 py-1 text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 shadow-sm">
                      {viewCount} Views
                    </span>
                  </motion.div>
                </div>
        
                {/* Tabbed Content - Mobile-friendly tabs */}
                <div className="mt-6 sm:mt-8">
                  <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                    <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 overflow-x-auto">
                      {tabs.map((tab) => (
                        <Tab
                          key={tab.name}
                          className={({ selected }) =>
                            `py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium leading-5 rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                              selected
                                ? 'bg-white dark:bg-gray-900 shadow-md text-indigo-600'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-white/[0.4] hover:text-gray-800 dark:hover:text-white'
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
                          className={`rounded-xl bg-white dark:bg-gray-950 p-2 sm:p-3 focus:outline-none ${
                            selectedTab === idx ? 'block' : 'hidden'
                          }`}
                        >
                          {tab.content}
                        </Tab.Panel>
                      ))}
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }