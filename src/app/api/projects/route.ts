import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth/next');
    const authOptions = await import('../auth/[...nextauth]/route');
    
    const session = await getServerSession(authOptions.GET);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const formData = await request.formData();
    
    // Handle file uploads
    const imageFiles = formData.getAll('imageFiles');
    const { saveFile } = await import('@/lib/upload');
    const imageUrls = [];
    
    for (const file of imageFiles) {
      if (file instanceof File) {
        const imageUrl = await saveFile(file);
        imageUrls.push(imageUrl);
      }
    }
    
    // Handle project file upload (ZIP)
    let projectFilePath = null;
    const projectFile = formData.get('projectFile');
    if (projectFile instanceof File) {
      projectFilePath = await saveFile(projectFile, 'projects');
    }
    
    // Handle QR code upload
    let qrCodePath = null;
    const qrCodeFile = formData.get('qrCodeFile');
    if (qrCodeFile instanceof File) {
      qrCodePath = await saveFile(qrCodeFile, 'qrcodes');
    }

    // Get other form data
    const projectData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      projectType: formData.get('projectType'),
      images: imageUrls,
      technologies: JSON.parse(formData.get('technologies') as string || '[]'),
      features: JSON.parse(formData.get('features') as string || '[]'),
      demoUrl: formData.get('demoUrl'),
      githubUrl: formData.get('githubUrl'),
      projectFile: projectFilePath,
      paymentQrCode: qrCodePath
    };

    const project = await Project.create(projectData);
    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    const message = error instanceof Error ? error.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth/next');
    const authOptions = await import('../auth/[...nextauth]/route');
    
    const session = await getServerSession(authOptions.GET);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const formData = await request.formData();
    
    // Handle file uploads
    const imageFiles = formData.getAll('imageFiles');
    const { saveFile } = await import('@/lib/upload');
    const uploadedImageUrls = [];
    
    for (const file of imageFiles) {
      if (file instanceof File) {
        const imageUrl = await saveFile(file);
        uploadedImageUrls.push(imageUrl);
      }
    }

    const projectId = formData.get('id') as string;
    // Get existing project to preserve any images that weren't changed
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Handle project file upload (ZIP)
    let projectFilePath = existingProject.projectFile;
    const projectFile = formData.get('projectFile');
    if (projectFile instanceof File) {
      projectFilePath = await saveFile(projectFile, 'projects');
    } else if (formData.get('existingProjectFile')) {
      projectFilePath = formData.get('existingProjectFile') as string;
    }
    
    // Handle QR code upload
    let qrCodePath = existingProject.paymentQrCode;
    const qrCodeFile = formData.get('qrCodeFile');
    if (qrCodeFile instanceof File) {
      qrCodePath = await saveFile(qrCodeFile, 'qrcodes');
    } else if (formData.get('existingQrCode')) {
      qrCodePath = formData.get('existingQrCode') as string;
    }

    const existingImages = existingProject.images || [];
    const combinedImages = [...existingImages, ...uploadedImageUrls];

    // Get other form data
    const projectData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      projectType: formData.get('projectType'),
      images: combinedImages,
      technologies: JSON.parse(formData.get('technologies') as string || '[]'),
      features: JSON.parse(formData.get('features') as string || '[]'),
      demoUrl: formData.get('demoUrl'),
      githubUrl: formData.get('githubUrl'),
      projectFile: projectFilePath,
      paymentQrCode: qrCodePath,
      updatedAt: new Date()
    };

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      projectData,
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error: unknown) {
    console.error('Error updating project:', error);
    const message = error instanceof Error ? error.message : 'Failed to update project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { getServerSession } = await import('next-auth/next');
    const authOptions = await import('../auth/[...nextauth]/route');
    
    const session = await getServerSession(authOptions.GET);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting project:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}