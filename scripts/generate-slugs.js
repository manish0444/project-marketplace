/**
 * Script to generate slugs for all existing projects that don't have them
 * Run this script with: node scripts/generate-slugs.js
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-showcase';

// Function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

async function generateSlugs() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projectsCollection = db.collection('projects');
    
    // Find all projects without slugs
    const projectsWithoutSlugs = await projectsCollection.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ] 
    }).toArray();
    
    console.log(`Found ${projectsWithoutSlugs.length} projects without slugs`);
    
    // Generate and update slugs
    let updatedCount = 0;
    
    for (const project of projectsWithoutSlugs) {
      if (!project.title) {
        console.log(`Project ${project._id} has no title, skipping`);
        continue;
      }
      
      // Generate base slug from title
      let baseSlug = generateSlug(project.title);
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug already exists
      let slugExists = await projectsCollection.findOne({ slug, _id: { $ne: project._id } });
      
      // If slug exists, append a number until we find a unique slug
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        slugExists = await projectsCollection.findOne({ slug, _id: { $ne: project._id } });
      }
      
      // Update the project with the new slug
      await projectsCollection.updateOne(
        { _id: project._id },
        { $set: { slug } }
      );
      
      console.log(`Updated project ${project._id}: "${project.title}" with slug "${slug}"`);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} projects with slugs`);
    
  } catch (error) {
    console.error('Error generating slugs:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
generateSlugs().catch(console.error);
