import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Ensure the uploads directory exists when the module is loaded
(() => {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create subdirectories for different file types
    const subdirs = ['projects', 'qrcodes', 'payments'];
    subdirs.forEach(dir => {
      const subDir = path.join(uploadDir, dir);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
    });
  } catch (error) {
    console.error('Failed to create uploads directory:', error);
  }
})();

export async function saveFile(file: File, subDirectory: string = '') {
  try {
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
    console.error('Failed to save file:', error);
    throw new Error('Failed to save file');
  }
}