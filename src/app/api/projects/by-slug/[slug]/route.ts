import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { message: 'Project slug is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find project by slug
    const project = await Project.findOne({ slug });
    
    if (!project) {
      // If no project found by slug, try to find by ID (for backward compatibility)
      try {
        const projectById = await Project.findById(slug);
        
        if (projectById) {
          // If project has a slug, redirect to the slug URL
          if (projectById.slug) {
            // Return a redirect response to the slug URL
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
            return NextResponse.redirect(`${baseUrl}/projects/${projectById.slug}`);
          }
          
          // If no slug yet, return the project data
          return NextResponse.json(projectById);
        }
      } catch (idError) {
        // ID lookup failed, continue to 404 response
      }
      
      // If both lookups fail, return 404
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project by slug:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
