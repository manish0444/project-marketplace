// This script updates all existing projects to set the forSale property to true by default
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function updateProjects() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    return;
  }

  console.log('Using MongoDB URI:', uri.substring(0, 20) + '...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db();
    const projectsCollection = database.collection('projects');

    // Count total projects
    const totalProjects = await projectsCollection.countDocuments();
    console.log(`Total projects in database: ${totalProjects}`);

    // Count projects without forSale property
    const projectsWithoutForSale = await projectsCollection.countDocuments({ forSale: { $exists: false } });
    console.log(`Projects without forSale property: ${projectsWithoutForSale}`);

    // Find all projects that don't have the forSale property
    const result = await projectsCollection.updateMany(
      { forSale: { $exists: false } },
      { $set: { forSale: true } }
    );

    console.log(`Updated ${result.modifiedCount} projects`);

    // Verify the update
    const projectsWithForSale = await projectsCollection.countDocuments({ forSale: { $exists: true } });
    console.log(`Projects with forSale property after update: ${projectsWithForSale}`);
  } catch (error) {
    console.error('Error updating projects:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

updateProjects().catch(console.error);
