import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Purchase from '@/models/Purchase';
import { GET as authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Extended session interface with user properties
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

// API endpoint to update delivery email for a purchase (admin only)
export async function POST(request: NextRequest) {
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
    if (!isAdmin) {
      // Try to find user in database to verify role
      try {
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
        const userRecord = await User.findById(session.user.id);
        if (!userRecord || userRecord.role !== 'admin') {
          return NextResponse.json({ 
            success: false, 
            message: 'Admin access required' 
          }, { status: 403 });
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Failed to verify admin role' 
        }, { status: 500 });
      }
    }
    
    // Get request data
    const data = await request.json();
    const { purchaseId, deliveryEmail } = data;
    
    if (!purchaseId || !deliveryEmail) {
      return NextResponse.json({ 
        success: false, 
        message: 'Purchase ID and delivery email are required' 
      }, { status: 400 });
    }
    
    // Validate Gmail address
    if (!deliveryEmail.match(/^[\w-\.]+@gmail\.com$/)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please provide a valid Gmail address' 
      }, { status: 400 });
    }
    
    // Update purchase with delivery email
    const purchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      { deliveryEmail },
      { new: true }
    );
    
    if (!purchase) {
      return NextResponse.json({ 
        success: false, 
        message: 'Purchase not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Delivery email updated successfully',
      purchase
    });
  } catch (error) {
    console.error('Error updating delivery email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update delivery email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
