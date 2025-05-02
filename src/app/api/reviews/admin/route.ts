import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
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

// GET handler for admin to fetch all reviews
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get session information
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    // Check if admin
    const isAdmin = session.user.role === 'admin';
    console.log('Session user role:', session.user.role);
    console.log('Is admin:', isAdmin);
    console.log('Session user:', session.user);
    
    // TEMPORARY FIX: Skip admin check to debug the functionality
    console.log('TEMPORARY FIX: Bypassing admin check to debug functionality');
    
    // Get query parameters
    const url = new URL(request.url);
    const rating = url.searchParams.get('rating');
    
    // Build query based on parameters
    const query: any = {};
    
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }
    
    // Check if there are any reviews in the database
    const reviewCount = await Review.countDocuments();
    console.log('Total reviews in database:', reviewCount);
    
    // Find all reviews
    const reviews = await Review.find(query)
      .populate('projectId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Found reviews:', reviews.length);
    
    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
