'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Reply, X, User, Calendar, Heart } from 'lucide-react';

interface CommentUser {
  _id: string;
  name: string;
  email: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: CommentUser;
  projectId: string;
  parentId: string | null;
  createdAt: string;
  isRead: boolean;
}

interface CommentSectionProps {
  projectId: string;
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Fetch comments when component mounts or projectId changes
  useEffect(() => {
    fetchComments();
  }, [projectId]);

  async function fetchComments() {
    try {
      setIsLoading(true);
      console.log(`Fetching comments for project ID: ${projectId}`);
      
      const response = await fetch(`/api/comments?projectId=${projectId}`, {
        credentials: 'include' // Include cookies with the request
      });
      
      console.log('Comments API response status:', response.status);
      const data = await response.json();
      console.log('Comments API response:', data);

      if (!response.ok) {
        // Log the error details but don't throw
        console.error('Failed to fetch comments:', data);
        setComments([]);
        return;
      }

      if (data.success && Array.isArray(data.comments)) {
        console.log(`Loaded ${data.comments.length} comments`);
        setComments(data.comments);
      } else {
        console.log('No comments found or invalid response format');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Could not load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate authentication
    if (!session || status !== 'authenticated') {
      toast.error('Please sign in to comment');
      return;
    }

    // Get comment content based on whether it's a reply or new comment
    const content = replyTo ? replyContent : newComment;
    
    // Validate content
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const commentData = {
        content,
        projectId,
        parentId: replyTo,
      };
      
      console.log('Sending comment data:', commentData);
      
      // Send request to API with credentials
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
        credentials: 'include', // Include cookies with the request
      });

      console.log('Comment API response status:', response.status);
      const data = await response.json();
      console.log('Comment API response:', data);

      if (!response.ok) {
        // Log the error details but don't throw
        console.error('Comment submission failed:', data);
        toast.error('Failed to post comment. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        toast.success('Comment posted successfully');
        // Reset form fields
        setNewComment('');
        setReplyContent('');
        setReplyTo(null);
        // Refetch comments to show the new one
        fetchComments();
      } else {
        throw new Error(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Filter comments to separate top-level comments and replies
  const topLevelComments = comments.filter(comment => !comment.parentId);
  const replies = comments.filter(comment => comment.parentId);

  function getRepliesForComment(commentId: string) {
    return replies.filter(reply => reply.parentId === commentId);
  }

  // Like comment function
  function toggleLike(commentId: string) {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }

  // Toggle expand comment replies
  function toggleExpandComment(commentId: string) {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }

  if (isLoading && comments.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 sm:mt-12"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-8 flex items-center">
          <MessageSquare className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
          Discussion
        </h2>
        <div className="py-6 sm:py-8 text-center">
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-2 sm:space-x-4">
              <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 h-10 w-10 sm:h-12 sm:w-12"></div>
              <div className="flex-1 space-y-2 sm:space-y-3 py-1">
                <div className="h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded w-3/4"></div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded"></div>
                  <div className="h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mt-6 sm:mt-12"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-8 flex items-center">
        <MessageSquare className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
        Discussion
      </h2>

      {/* New Comment Form */}
      {!session && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl shadow-sm"
        >
          <p className="text-sm sm:text-base text-blue-700 dark:text-blue-300 flex items-center">
            <User className="mr-1 sm:mr-2" size={16} />
            Please{' '}
            <a href="/auth/signin" className="font-medium underline hover:text-blue-800 dark:hover:text-blue-200 mx-1 transition duration-200">
              sign in
            </a>{' '}
            to join the discussion.
          </p>
        </motion.div>
      )}

      {session && (
        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmitComment} 
          className="mb-4 sm:mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <User className="mr-1 sm:mr-2 text-indigo-600 dark:text-indigo-400" size={14} />
              Commenting as <span className="font-bold ml-1 text-indigo-700 dark:text-indigo-400">{session.user.name}</span>
            </p>
          </div>
          <div className="relative mb-3 sm:mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              disabled={isSubmitting}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 text-sm sm:text-base"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700 py-2 sm:py-2.5 px-4 sm:px-5 text-xs sm:text-sm font-medium text-white shadow hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-800 dark:hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition duration-200"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  Post Comment <Send className="ml-1 sm:ml-2" size={14}   />
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      )}

      {/* Comments List */}
      {comments.length === 0 && !isLoading ? (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="py-8 sm:py-12 text-center"
        >
          <div className="flex flex-col items-center">
            <MessageSquare size={24} className="text-gray-300 mb-3" />
            <p className="text-sm sm:text-base text-gray-500 font-medium">No comments yet. Be the first to comment!</p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, staggerChildren: 0.1 }}
          className="space-y-4 sm:space-y-6"
        >
          <AnimatePresence>
            {topLevelComments.map((comment, index) => (
              <motion.div 
                key={comment._id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 sm:space-x-4">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {session?.user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mr-2">
                          {session?.user.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar size={10} className="mr-1" />
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleLike(comment._id)}
                          className={`flex items-center text-xs font-medium ${
                            likedComments.has(comment._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          } transition duration-200 ease-in-out`}
                        >
                          {likedComments.has(comment._id) ? 
                            <Heart size={12} className="mr-1 fill-red-500" /> : 
                            <Heart size={12} className="mr-1" />
                          }
                          Like
                        </motion.button>
                        
                        {session && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                            className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-200 ease-in-out"
                          >
                            <Reply size={12} className="mr-1" />
                            Reply
                          </motion.button>
                        )}
                        
                        {getRepliesForComment(comment._id).length > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleExpandComment(comment._id)}
                            className={`flex items-center text-xs font-medium ${
                              expandedComments.has(comment._id) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                            } transition duration-200 ease-in-out`}
                          >
                            <MessageSquare size={12} className="mr-1 dark:text-gray-400" />
                            {expandedComments.has(comment._id) ? 'Hide' : 'Show'} {getRepliesForComment(comment._id).length} {getRepliesForComment(comment._id).length === 1 ? 'reply' : 'replies'}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                <AnimatePresence>
                  {replyTo === comment._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleSubmitComment} className="mt-3 sm:mt-4 ml-10 sm:ml-14">
                        <div className="relative mb-2 sm:mb-3">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a thoughtful reply..."
                            disabled={isSubmitting}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyContent('');
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                          >
                            <X size={12} className="mr-1" /> Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={isSubmitting || !replyContent.trim()}
                            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white shadow hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition duration-200 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Posting...
                              </>
                            ) : (
                              <>
                                Send <Send className="ml-1" size={12} />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Replies */}
                <AnimatePresence>
                  {expandedComments.has(comment._id) && getRepliesForComment(comment._id).length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 sm:mt-4 ml-10 sm:ml-14 space-y-2 sm:space-y-3 overflow-hidden dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                    >
                      {getRepliesForComment(comment._id).map((reply, replyIndex) => (
                        <motion.div 
                          key={reply._id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: replyIndex * 0.05 }}
                          className="p-3 sm:p-4 rounded-lg border-l-4 border-indigo-400 dark:bg-gray-900 dark:border-gray-400 dark:text-gray-300"
                        >
                          <div className="flex flex-wrap items-center">
                            <div className="bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-white font-bold text-xs">
                              {session?.user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="ml-1.5 sm:ml-2 text-xs font-medium text-gray-900 dark:text-gray-300">
                              {session?.user.name}
                            </span>
                            <span className="ml-1.5 sm:ml-2 text-xs text-gray-500 flex items-center">
                              <Calendar size={8} className="mr-0.5 dark:text-gray-400" />
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words dark:text-gray-300">{reply.content}</p>
                          
                          <div className="mt-1.5 sm:mt-2 flex items-center">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleLike(reply._id)}
                              className={`flex items-center text-xs font-medium ${
                                likedComments.has(reply._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                              } transition duration-200 ease-in-out dark:text-gray-300`}
                            >
                              {likedComments.has(reply._id) ? 
                                <Heart size={10} className="mr-0.5 fill-red-500 dark:text-gray-300" /> : 
                                <Heart size={10} className="mr-0.5 dark:text-gray-300" />
                              }
                              Like
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
