// Import the cloud storage utility
import { saveFile as cloudSaveFile } from './cloudStorage';

// Re-export the saveFile function from cloudStorage
export const saveFile = cloudSaveFile;