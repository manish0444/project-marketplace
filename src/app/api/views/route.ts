import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import View from '@/models/View';
import mongoose from 'mongoose';

// POST handler for tracking views
export async function POST(request: NextRequest) {
  console.log('POST request to /api/views received');
  try {
    await connectDB();
    
    // Get request data
    const data = await request.json();
    const { projectId, deviceId } = data;
    
    console.log('View tracking data received:', { projectId, deviceId });
    
    if (!projectId || !deviceId) {
      return NextResponse.json({
        success: false,
        message: 'Project ID and Device ID are required'
      }, { status: 400 });
    }
    
    // If projectId looks like a slug rather than an ObjectId, find the project by slug first
    let actualProjectId = projectId;
    
    if (typeof projectId === 'string' && !mongoose.isValidObjectId(projectId)) {
      console.log('ProjectId appears to be a slug:', projectId);
      const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}));
      
      try {
        // Find the project by slug
        const project = await Project.findOne({ slug: projectId });
        
        if (project) {
          console.log('Found project by slug:', project._id);
          // Use the actual ObjectId
          actualProjectId = project._id;
        } else {
          console.log('No project found with slug:', projectId);
          // Return success anyway - view tracking should never break the app
          return NextResponse.json({
            success: true,
            message: 'View not recorded - project not found'
          });
        }
      } catch (error) {
        console.error('Error finding project by slug:', error);
        // Return success anyway - view tracking should never break the app
        return NextResponse.json({
          success: true,
          message: 'View not recorded - error finding project'
        });
      }
    }
    
    // Try to create a new view entry (will fail if unique constraint is violated - same device/project combo exists)
    try {
      await View.create({
        projectId: actualProjectId,
        deviceId
      });
      
      // Success - this is a new view
      return NextResponse.json({
        success: true,
        message: 'View recorded successfully'
      });
    } catch (error) {
      // If the error is a duplicate key error, it means this device has already viewed this project
      // This is expected behavior, so we'll return success
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return NextResponse.json({
          success: true,
          message: 'View already recorded for this device'
        });
      }
      
      // For other errors, propagate to the outer catch block
      throw error;
    }
  } catch (error) {
    console.error('Error recording view:', error);
    
    // Return a 200 status even on error - view tracking should never break the app
    return NextResponse.json({
      success: false,
      message: 'Failed to record view',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

// GET handler for fetching view count
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
    
    // If projectId looks like a slug rather than an ObjectId, find the project by slug first
    let actualProjectId = projectId;
    
    if (typeof projectId === 'string' && !mongoose.isValidObjectId(projectId)) {
      console.log('ProjectId appears to be a slug:', projectId);
      const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}));
      
      try {
        // Find the project by slug
        const project = await Project.findOne({ slug: projectId });
        
        if (project) {
          console.log('Found project by slug:', project._id);
          // Use the actual ObjectId
          actualProjectId = project._id;
        } else {
          console.log('No project found with slug:', projectId);
          // Return zero views if no project found
          return NextResponse.json({
            success: true,
            viewCount: 0
          });
        }
      } catch (error) {
        console.error('Error finding project by slug:', error);
        // Return zero views if error
        return NextResponse.json({
          success: true,
          viewCount: 0
        });
      }
    }
    
    // Count views for the project using the actual ObjectId
    const viewCount = await View.countDocuments({ projectId: actualProjectId });
    
    return NextResponse.json({
      success: true,
      viewCount
    });
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch views',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
