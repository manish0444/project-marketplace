'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Review } from '@/types/project';
import { StarIcon, TrashIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [adminFlag, setAdminFlag] = useState(false);
  const [mobileOpenRows, setMobileOpenRows] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchReviews();
    }
  }, [status, filter, session]);
  
  useEffect(() => {
    if (session?.user && session.user.id && !session.user.role) {
      setAdminFlag(true);
    }
  }, [session]);
  
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reviews/admin', {
        credentials: 'include',
        headers: adminFlag ? { 'X-Admin-Request': 'true' } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews);
        } else {
          toast.error(data.message || 'Failed to fetch reviews');
        }
      } else {
        toast.error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleMobileRow = (reviewId: string) => {
    const newOpenRows = new Set(mobileOpenRows);
    if (newOpenRows.has(reviewId)) {
      newOpenRows.delete(reviewId);
    } else {
      newOpenRows.add(reviewId);
    }
    setMobileOpenRows(newOpenRows);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: adminFlag ? { 'X-Admin-Request': 'true' } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Review deleted successfully');
          setReviews(reviews.filter(review => review._id !== reviewId));
        } else {
          toast.error(data.message || 'Failed to delete review');
        }
      } else {
        toast.error('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.rating === parseInt(filter);
  });

  if (status === 'loading' || loading) {
    return (
      <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Reviews Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Reviews Management</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-600 dark:text-red-400">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Reviews Management</h1>
        
        <div className="flex items-center">
          <label htmlFor="filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Rating:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>
      
      {filteredReviews.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {typeof review.projectId === 'object' ? (
                          <Link 
                            href={`/projects/${review.projectId._id}`} 
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          >
                            {review.projectId.title}
                          </Link>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Unknown Project</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {typeof review.userId === 'object' && review.userId.name ? (
                          <div>
                            <div className="text-gray-900 dark:text-white">{review.userId.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{review.userId.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Unknown User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${i <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-500'}`}
                              />
                            ))}
                          </div>
                          <span className="text-gray-900 dark:text-white">{review.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-gray-900 dark:text-white line-clamp-2">
                          {review.comment}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredReviews.map((review) => (
              <div 
                key={review._id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleMobileRow(review._id)}
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {typeof review.projectId === 'object' ? review.projectId.title : 'Unknown Project'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typeof review.userId === 'object' && review.userId.name ? review.userId.name : 'Unknown User'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${i <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-500'}`}
                        />
                      ))}
                    </div>
                    {mobileOpenRows.has(review._id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>

                {mobileOpenRows.has(review._id) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">User Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof review.userId === 'object' && review.userId.email ? review.userId.email : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {review.rating} / 5
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Comment</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {review.comment}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="w-full flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400 text-center">No reviews found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}