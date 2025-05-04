// Cloud storage utility for production environments
// This uses Cloudinary for image and file storage
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import os from 'os';

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'default', 
  api_key: process.env.CLOUDINARY_API_KEY || 'default', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'default',
  secure: true
});

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

// Helper function to create a temporary file
async function createTempFile(buffer: Buffer, extension: string): Promise<string> {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${randomUUID()}.${extension}`);
  await fs.promises.writeFile(tempFilePath, buffer);
  return tempFilePath;
}

export async function uploadToCloudinary(file: File, folder: string = 'general'): Promise<string> {
  try {
    console.log(`Uploading file to Cloudinary: ${file.name} (${file.size} bytes) to folder ${folder}`);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Create a temporary file
    const tempFilePath = await createTempFile(buffer, extension);
    
    try {
      // Upload to Cloudinary using the SDK
      const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
        cloudinary.uploader.upload(tempFilePath, {
          folder: folder,
          resource_type: 'auto',
        }, (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result as CloudinaryResponse);
          }
        });
      });
      
      console.log(`Successfully uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } finally {
      // Clean up the temporary file
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload file to cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fallback to local storage for development environment
export async function saveFileLocal(file: File, subDirectory: string = ''): Promise<string> {
  try {
    const fs = require('fs');
    const path = require('path');
    const { randomUUID } = require('crypto');
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine the upload directory (main or subdirectory)
    let uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (subDirectory) {
      uploadDir = path.join(uploadDir, subDirectory);
      // Ensure the subdirectory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }

    // Generate unique filename with original extension
    const uniqueId = randomUUID();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${uniqueId}.${extension}`;
    
    const filepath = path.join(uploadDir, filename);
    
    // Write file
    await fs.promises.writeFile(filepath, buffer);
    
    // Return the public URL with subdirectory if present
    return subDirectory 
      ? `/uploads/${subDirectory}/${filename}` 
      : `/uploads/${filename}`;
  } catch (error) {
    console.error('Failed to save file locally:', error);
    throw new Error('Failed to save file locally');
  }
}

// Smart file saving function that uses cloud storage in production and local storage in development
export async function saveFile(file: File, subDirectory: string = ''): Promise<string> {
  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Use cloud storage in production
    return uploadToCloudinary(file, subDirectory);
  } else {
    // Use local storage in development
    return saveFileLocal(file, subDirectory);
  }
}
