import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import View from '@/models/View';

// POST handler for tracking views
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get request data
    const data = await request.json();
    const { projectId, deviceId } = data;
    
    if (!projectId || !deviceId) {
      return NextResponse.json({
        success: false,
        message: 'Project ID and Device ID are required'
      }, { status: 400 });
    }
    
    // Try to create a new view entry (will fail if unique constraint is violated - same device/project combo exists)
    try {
      await View.create({
        projectId,
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
    return NextResponse.json({
      success: false,
      message: 'Failed to record view',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    
    // Count views for the project
    const viewCount = await View.countDocuments({ projectId });
    
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
