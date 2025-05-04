import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import mongoose from 'mongoose';
import { GET as authOptions } from '../auth/[...nextauth]/route';

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

// GET handler for fetching reviews
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        message: 'Project ID is required'
      }, { status: 400 });
    }
    
    // Find reviews for the project
    const reviews = await Review.find({ projectId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
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

// POST handler for creating a review
export async function POST(request: NextRequest) {
  console.log('POST request to /api/reviews received');
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
    
    // Log session for debugging
    console.log('User in session:', {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    });
    
    // Get request data
    const data = await request.json();
    const { projectId, rating, comment, userId, email } = data;
    
    console.log('Review data received:', { projectId, rating, comment, userId, email });
    
    // Handle missing user ID by trying to find the user by email
    let actualUserId = session.user.id;
    
    if (!actualUserId && (session.user.email || email)) {
      // Try to find the user by email
      try {
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
        const userEmail = session.user.email || email;
        console.log('Trying to find user by email:', userEmail);
        
        const userByEmail = await User.findOne({ email: userEmail });
        if (userByEmail) {
          actualUserId = userByEmail._id.toString();
          console.log('Found user ID by email lookup:', actualUserId);
        } else {
          // Create a temporary user if we can't find one but have an email
          if (userEmail) {
            const tempUser = await User.create({
              name: session.user.name || 'Anonymous',
              email: userEmail,
              role: 'user'
            });
            actualUserId = tempUser._id.toString();
            console.log('Created temporary user with ID:', actualUserId);
          }
        }
      } catch (error) {
        console.error('Error looking up user by email:', error);
      }
    }
    
    // If we still don't have a user ID, use the provided one or return error
    if (!actualUserId) {
      if (userId) {
        actualUserId = userId;
        console.log('Using provided userId:', actualUserId);
      } else {
        return NextResponse.json({
          success: false,
          message: 'Could not determine user ID'
        }, { status: 400 });
      }
    }
    
    console.log('Final userId used for review:', actualUserId);
    
    if (!projectId || !rating || !comment) {
      return NextResponse.json({
        success: false,
        message: 'Project ID, rating, and comment are required'
      }, { status: 400 });
    }
    
    // Check if user has already reviewed this project
    const existingReview = await Review.findOne({
      projectId,
      userId: actualUserId
    });
    
    let review;
    
    if (existingReview) {
      // Update existing review
      review = await Review.findByIdAndUpdate(
        existingReview._id,
        { rating, comment },
        { new: true }
      ).populate('userId', 'name email');
      
      return NextResponse.json({
        success: true,
        message: 'Review updated successfully',
        review
      });
    } else {
      // Create new review
      try {
        // Create review document
        const reviewData = {
          projectId,
          userId: actualUserId,
          rating,
          comment
        };
        
        console.log('Creating review with:', reviewData);
        
        review = await Review.create(reviewData);
        
        // Populate user information
        review = await Review.findById(review._id).populate('userId', 'name email');
        
        return NextResponse.json({
          success: true,
          message: 'Review submitted successfully',
          review
        });
      } catch (createError) {
        console.error('Error creating review:', createError);
        return NextResponse.json({
          success: false,
          message: 'Failed to create review',
          error: createError instanceof Error ? createError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit review',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
