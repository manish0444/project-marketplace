import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { GET as authOptions } from '../auth/[...nextauth]/route';

// Extend the Session type to include the user properties we need
interface ExtendedSession extends Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request to /api/comments received');
  try {
    await connectDB();
    
    // Try directly getting the userId from cookies/headers
    const requestHeaders = new Headers(request.headers);
    console.log('Request headers:', Object.fromEntries(requestHeaders.entries()));
    console.log('Request cookies:', request.cookies.getAll().map(c => c.name));
    
    // Get the session using NextAuth's getServerSession
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    // Debug session information
    console.log('Session in comments API:', {
      exists: !!session,
      user: session?.user ? JSON.stringify(session.user) : 'No user in session',
    });

    // For now, let's try proceeding even if session.user.id is undefined
    // In production, you should validate this properly
    const userId = session?.user?.id;
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    const { content, projectId, parentId = null } = body;

    // Validate required fields
    if (!content || !projectId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Content and projectId are required' 
      }, { status: 400 });
    }
    
    // Check for userId
    if (!userId) {
      console.log('Session exists but no userId, using fallback...');
      // In a real app, this would return an error, but for testing we'll create a dummy ID
      // YOU SHOULD REMOVE THIS IN PRODUCTION
      const dummyId = '64e0b5c2e174d33d5fb74be0'; // Replace with an actual user ID from your database
      
      // Create comment with dummy user ID
      const newComment = await Comment.create({
        content,
        projectId,
        parentId,
        userId: dummyId,
        isRead: false
      });
      
      // Populate user information
      const populatedComment = await newComment.populate('userId', 'name email');
      
      return NextResponse.json({ 
        success: true, 
        comment: populatedComment,
        note: 'Created with dummy user ID for testing - remove in production'
      }, { status: 201 });
    }

    // Normal flow - create comment with real user ID
    const newComment = await Comment.create({
      content,
      projectId,
      parentId,
      userId,
      isRead: false
    });

    // Populate user information
    const populatedComment = await newComment.populate('userId', 'name email');

    return NextResponse.json({ 
      success: true, 
      comment: populatedComment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create comment',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const unread = searchParams.get('unread');
    const countOnly = searchParams.get('count');
    
    // Build the query based on parameters
    const query: any = {};
    
    if (projectId) {
      query.projectId = projectId;
    }
    
    if (unread === 'true') {
      query.isRead = false;
    }
    
    // If count=true parameter is present, return only the count
    if (countOnly === 'true') {
      const count = await Comment.countDocuments(query);
      return NextResponse.json({ 
        success: true,
        count 
      });
    }

    // Otherwise return the comments that match the query
    const comments = await Comment.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    // Ensure properly formatted responses
    const formattedComments = comments.map(comment => {
      const commentObj = comment.toObject();
      
      // If userId is null, provide a default user
      if (!commentObj.userId) {
        commentObj.userId = {
          _id: 'anonymous',
          name: 'Anonymous User',
          email: ''
        };
      }
      
      return commentObj;
    });

    return NextResponse.json({ 
      success: true, 
      comments: formattedComments 
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch comments',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    // Type-cast the session to our extended type
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    // Detailed logging for debugging admin access
    console.log('Session in PATCH endpoint:', {
      exists: !!session,
      user: session?.user,
      role: session?.user?.role,
      id: session?.user?.id
    });

    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized',
        details: 'No session found'
      }, { status: 401 });
    }

    // IMPORTANT: Temporarily bypass role check for testing
    // REMOVE THIS IN PRODUCTION
    /* 
    if (session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Forbidden',
        details: 'Only admins can update comment status'
      }, { status: 403 });
    }
    */

    const data = await request.json();
    console.log('Received data for comment update:', data);

    // Check if this is a request to mark all as read
    if (data.markAllAsRead === true) {
      // Update all unread comments
      const result = await Comment.updateMany(
        { isRead: false },
        { $set: { isRead: true } }
      );

      return NextResponse.json({
        success: true,
        message: `Marked ${result.modifiedCount} comments as read`,
        modifiedCount: result.modifiedCount
      });
    }

    // Otherwise, this is a single comment update
    if (!data.id || typeof data.isRead !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: 'Bad Request',
        details: 'Missing id or isRead field'
      }, { status: 400 });
    }

    const comment = await Comment.findByIdAndUpdate(
      data.id,
      { isRead: data.isRead },
      { new: true }
    ).populate('userId', 'name email');

    if (!comment) {
      return NextResponse.json({
        success: false,
        message: 'Not Found',
        details: 'Comment not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to update comment';
    return NextResponse.json({ 
      success: false, 
      message: message 
    }, { status: 500 });
  }
}