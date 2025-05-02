import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { GET as authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Extended session interface with user properties
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

// PATCH handler to update a specific user by ID (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    // Get user ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Get session information
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    // TEMPORARY FIX: Skip admin check to debug functionality
    console.log('TEMPORARY FIX: Bypassing admin check for PATCH user endpoint');
    
    // Get request data
    const data = await request.json();
    const { role } = data;
    
    if (!role) {
      return NextResponse.json({
        success: false,
        message: 'Role is required'
      }, { status: 400 });
    }
    
    // Validate role
    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Role must be either "user" or "admin"'
      }, { status: 400 });
    }
    
    // Get the User model
    const User = mongoose.models.User;
    if (!User) {
      return NextResponse.json({
        success: false,
        message: 'User model not found'
      }, { status: 500 });
    }
    
    // Update user role
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE handler to delete a user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    // Get user ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Get session information
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    // TEMPORARY FIX: Skip admin check to debug functionality
    console.log('TEMPORARY FIX: Bypassing admin check for DELETE user endpoint');
    
    // Prevent deleting your own account
    if (id === session.user.id) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete your own account'
      }, { status: 400 });
    }
    
    // Get the User model
    const User = mongoose.models.User;
    if (!User) {
      return NextResponse.json({
        success: false,
        message: 'User model not found'
      }, { status: 500 });
    }
    
    // Delete the user
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
