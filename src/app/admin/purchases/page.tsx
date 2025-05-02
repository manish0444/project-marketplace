'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Purchase } from '@/types/project';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Check, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminPurchases() {
  const { data: session, status } = useSession();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [feedback, setFeedback] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminFlag, setAdminFlag] = useState(false);
  const [mobileOpenRows, setMobileOpenRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/';
      return;
    }
    
    if (session?.user) {
      console.log('Admin page - user session:', {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email
      });
    }
    
    fetchPurchases();
  }, [status, filter, session]);

  useEffect(() => {
    // Always set adminFlag to true for this admin page
    // This ensures the X-Admin-Request header is always sent
    setAdminFlag(true);
    console.log('Setting admin flag to true for admin purchases page');
  }, [session]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const queryParams = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/purchases${queryParams}`, {
        credentials: 'include',
        headers: adminFlag ? { 'X-Admin-Request': 'true' } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Admin page received purchases data:', {
            count: data.purchases.length,
            adminFlag: adminFlag,
            filter: filter,
            firstPurchase: data.purchases.length > 0 ? {
              id: data.purchases[0]._id,
              project: typeof data.purchases[0].projectId === 'object' ? data.purchases[0].projectId.title : 'unknown',
              user: typeof data.purchases[0].userId === 'object' ? data.purchases[0].userId.email : 'unknown',
              status: data.purchases[0].status
            } : 'none'
          });
          setPurchases(data.purchases);
        } else {
          toast.error(data.message || 'Failed to fetch purchases');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to fetch purchases');
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileRow = (purchaseId: string) => {
    const newOpenRows = new Set(mobileOpenRows);
    if (newOpenRows.has(purchaseId)) {
      newOpenRows.delete(purchaseId);
    } else {
      newOpenRows.add(purchaseId);
    }
    setMobileOpenRows(newOpenRows);
  };

  const handleApprove = async (purchaseId: string) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/purchases', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(adminFlag ? { 'X-Admin-Request': 'true' } : {})
        },
        body: JSON.stringify({
          id: purchaseId,
          status: 'approved'
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Purchase approved successfully');
        fetchPurchases();
      } else {
        toast.error(data.message || 'Failed to approve purchase');
      }
    } catch (error) {
      console.error('Error approving purchase:', error);
      toast.error('Failed to approve purchase');
    } finally {
      setProcessing(false);
      setSelectedPurchase(null);
    }
  };

  const handleReject = async (purchaseId: string) => {
    if (!feedback.trim()) {
      toast.error('Feedback is required when rejecting a purchase');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/purchases', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(adminFlag ? { 'X-Admin-Request': 'true' } : {})
        },
        body: JSON.stringify({
          id: purchaseId,
          status: 'rejected',
          feedback
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Purchase rejected successfully');
        fetchPurchases();
      } else {
        toast.error(data.message || 'Failed to reject purchase');
      }
    } catch (error) {
      console.error('Error rejecting purchase:', error);
      toast.error('Failed to reject purchase');
    } finally {
      setProcessing(false);
      setSelectedPurchase(null);
      setFeedback('');
    }
  };

  const handleSendProject = (email: string, projectTitle: string) => {
    try {
      const subject = encodeURIComponent(`Your Purchased Project: ${projectTitle}`);
      const body = encodeURIComponent(`Hello,\n\nThank you for your purchase! Your project files are attached to this email.\n\nBest regards,\nProject Showcase Team`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
      toast.success('Email client opened!');
    } catch (error) {
      console.error('Error opening email client:', error);
      toast.error('Failed to open email client');
    }
  };

  const handleSetDeliveryEmail = async (purchaseId: string, email: string) => {
    try {
      const response = await fetch('/api/purchases/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminFlag ? { 'X-Admin-Request': 'true' } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          purchaseId,
          deliveryEmail: email
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Delivery email updated successfully');
          fetchPurchases();
        } else {
          toast.error(data.message || 'Failed to update delivery email');
        }
      } else {
        toast.error('Failed to update delivery email');
      }
    } catch (error) {
      console.error('Error setting delivery email:', error);
      toast.error('Failed to update delivery email');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Purchases</h1>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Purchases</h1>
      
      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'pending' 
                ? 'bg-indigo-600 text-white dark:bg-indigo-700' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'approved' 
                ? 'bg-green-600 text-white dark:bg-green-700' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Approved
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'rejected' 
                ? 'bg-red-600 text-white dark:bg-red-700' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Rejected
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-gray-600 text-white dark:bg-gray-700' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>
      
      {/* Purchases List */}
      {purchases.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">
            No {filter !== 'all' ? filter : ''} purchases found.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Delivery Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {purchase.projectId && typeof purchase.projectId === 'object' && (
                          <>
                            {purchase.projectId.images && purchase.projectId.images[0] && (
                              <div className="h-10 w-10 flex-shrink-0 mr-3">
                                <Image 
                                  src={purchase.projectId.images[0].startsWith('http') 
                                    ? purchase.projectId.images[0] 
                                    : `/${purchase.projectId.images[0]}`} 
                                  alt={purchase.projectId.title} 
                                  width={40} 
                                  height={40} 
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {purchase.projectId.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ${purchase.projectId.price}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {purchase.userId && typeof purchase.userId === 'object' && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{purchase.userId.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{purchase.userId.email}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {purchase.deliveryEmail ? (
                        purchase.deliveryEmail
                      ) : (
                        <div className="flex items-center">
                          <span className="text-yellow-500 dark:text-yellow-400 mr-2">Not set</span>
                          {purchase.userId && typeof purchase.userId === 'object' && 'email' in purchase.userId && purchase.userId.email && (
                            <button 
                              className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              onClick={() => {
                                const userEmail = typeof purchase.userId === 'object' ? purchase.userId.email : '';
                                if (userEmail) {
                                  toast.success(`Using user's email: ${userEmail}`);
                                  handleSetDeliveryEmail(purchase._id, userEmail);
                                }
                              }}
                            >
                              Use {typeof purchase.userId === 'object' ? purchase.userId.email : ''}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                          : purchase.status === 'rejected' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}>
                        {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`${purchase.paymentProof}`, '_blank')}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View Proof
                        </button>
                        
                        {purchase.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(purchase._id)}
                              disabled={processing}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setSelectedPurchase(purchase)}
                              disabled={processing}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {purchase.status === 'approved' && (
                          <button
                            onClick={() => handleSendProject(
                              purchase.deliveryEmail, 
                              typeof purchase.projectId === 'object' ? purchase.projectId.title : 'Your Project'
                            )}
                            disabled={processing}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          >
                            Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {purchases.map((purchase) => (
              <div 
                key={purchase._id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleMobileRow(purchase._id)}
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {purchase.projectId && typeof purchase.projectId === 'object' ? purchase.projectId.title : 'Project'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {purchase.userId && typeof purchase.userId === 'object' ? purchase.userId.name : 'User'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                      purchase.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : purchase.status === 'rejected' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                    }`}>
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </span>
                    {mobileOpenRows.has(purchase._id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>

                {mobileOpenRows.has(purchase._id) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Project Price</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ${purchase.projectId && typeof purchase.projectId === 'object' ? purchase.projectId.price : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">User Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {purchase.userId && typeof purchase.userId === 'object' ? purchase.userId.email : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {purchase.deliveryEmail || (
                          <span className="text-yellow-500 dark:text-yellow-400">Not set</span>
                        )}
                      </p>
                      {!purchase.deliveryEmail && purchase.userId && typeof purchase.userId === 'object' && 'email' in purchase.userId && purchase.userId.email && (
                        <button
                          className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mt-1"
                          onClick={() => {
                            const userEmail = typeof purchase.userId === 'object' ? purchase.userId.email : '';
                            if (userEmail) {
                              toast.success(`Using user's email: ${userEmail}`);
                              handleSetDeliveryEmail(purchase._id, userEmail);
                            }
                          }}
                        >
                          Use {typeof purchase.userId === 'object' ? purchase.userId.email : ''}
                        </button>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        onClick={() => window.open(`${purchase.paymentProof}`, '_blank')}
                        className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Payment Proof
                      </button>

                      {purchase.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(purchase._id)}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => setSelectedPurchase(purchase)}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </div>
                      )}

                      {purchase.status === 'approved' && (
                        <button
                          onClick={() => handleSendProject(
                            purchase.deliveryEmail, 
                            typeof purchase.projectId === 'object' ? purchase.projectId.title : 'Your Project'
                          )}
                          disabled={processing}
                          className="w-full flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Project
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Rejection Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Reject Purchase</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Please provide feedback for the rejection:</p>
            
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={4}
              placeholder="Explain why the purchase is being rejected"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedPurchase(null);
                  setFeedback('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-gray-800 dark:text-white"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedPurchase._id)}
                className="px-4 py-2 bg-red-600 rounded-md text-white"
                disabled={processing || !feedback.trim()}
              >
                {processing ? 'Rejecting...' : 'Reject Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}