'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircleIcon, BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Comment {
  _id: string;
  content: string;
  userId: {
    name: string;
    email: string;
    _id: string;
  };
  projectId: {
    _id: string;
    title: string;
  } | string;
  createdAt: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.role !== 'admin') {
      router.push('/auth/signin');
      return;
    }

    fetchNotifications();
  }, [session, status, router]);

  async function fetchNotifications() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/comments?unread=true', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.details || 'Failed to fetch notifications');
        return;
      }

      const data = await res.json();
      
      if (data.success && Array.isArray(data.comments)) {
        setNotifications(data.comments);
        setUnreadCount(data.comments.length);
      } else {
        setNotifications(Array.isArray(data) ? data : []);
        setUnreadCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(commentId: string) {
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commentId,
          isRead: true,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || data.details || 'Failed to update notification');
        return;
      }
      
      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== commentId));
        setUnreadCount(prev => prev - 1);
        toast.success('Marked as read');
      } else {
        toast.error(data.message || 'Failed to update notification');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  }

  async function markAllAsRead() {
    if (notifications.length === 0) {
      toast.success('No notifications to mark as read');
      return;
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAllAsRead: true
        }),
        credentials: 'include',
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || data.details || 'Failed to update notifications');
        return;
      }
      
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success(data.message || `Marked all notifications as read`);
      } else {
        toast.error(data.message || 'Failed to update notifications');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  function getProjectTitle(project: Comment['projectId']) {
    if (typeof project === 'object' && project !== null) {
      return project.title;
    }
    return 'Project';
  }

  function getProjectId(project: Comment['projectId']) {
    if (typeof project === 'object' && project !== null) {
      return project._id;
    }
    return project;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {unreadCount} new
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Mark All as Read
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 sm:rounded-xl overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No unread notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You're all caught up! New comments will appear here.
              </p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className="flex items-start justify-between gap-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {notification.userId.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-x-2">
                      <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                        {notification.userId.name}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        commented on{' '}
                        <Link 
                          href={`/projects/${getProjectId(notification.projectId)}`} 
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                        >
                          {getProjectTitle(notification.projectId)}
                        </Link>
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300">
                      {notification.content}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="ml-4 flex-shrink-0 p-1 rounded-full text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}