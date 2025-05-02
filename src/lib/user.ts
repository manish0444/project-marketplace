import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function to get the current user ID from the session
export async function getCurrentUserId() {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('No session found');
      return null;
    }
    
    // Check if user exists in session
    const userObj = session as any;
    if (!userObj.user) {
      console.error('No user object in session');
      return null;
    }
    
    // Try various ways to get the user ID
    const user = userObj.user;
    
    // First, try to get the user ID directly from the session
    if (user.id) return user.id;
    if (user._id) return user._id;
    if (user.userId) return user.userId;
    
    // If no ID in session, try to find the user by email
    const userEmail = user.email;
    if (!userEmail) {
      console.error('No email found in session');
      return null;
    }
    
    // Get User model
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
    
    // Find user by email
    const userRecord = await User.findOne({ email: userEmail });
    if (!userRecord) {
      console.error('No user found with email:', userEmail);
      return null;
    }
    
    return userRecord._id.toString();
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
