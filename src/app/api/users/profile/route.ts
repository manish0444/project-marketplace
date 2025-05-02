import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { name, email, currentEmail } = await req.json();
    
    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Verify the current email matches the session email for security
    if (currentEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized email change' },
        { status: 403 }
      );
    }
    
    // Connect to the database
    await connectDB();
    
    // Check if the new email already exists (if changing email)
    if (email !== currentEmail) {
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 400 }
        );
      }
    }
    
    // Update user profile
    const result = await User.findOneAndUpdate(
      { email: currentEmail },
      { 
        $set: { 
          name, 
          email,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );
    
    if (!result) {
      // User not found, create a new user document
      await User.create({
        name,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await connectDB();
    
    // Find the user
    const user = await User.findOne(
      { email: session.user.email },
      { _id: 1, name: 1, email: 1, image: 1 }
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
