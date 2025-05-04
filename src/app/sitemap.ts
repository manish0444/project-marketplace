import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

interface Project {
  _id: string;
  title: string;
  slug?: string;
  updatedAt?: Date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use localhost for development, otherwise use the configured URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Connect to database
  const mongo = await connectToDatabase();
  const db = mongo.connection.db;
  
  // Fetch all projects for dynamic routes
  let projects: Project[] = [];
  
  try {
    if (db) {
      console.log('Fetching projects for sitemap...');
      const projectDocs = await db
        .collection('projects')
        .find({}, { projection: { _id: 1, title: 1, slug: 1, updatedAt: 1 } })
        .toArray();
      
      console.log(`Found ${projectDocs.length} projects in database`);
      
      // Cast to Project[] with type safety
      projects = projectDocs.map(doc => ({
        _id: doc._id.toString(),
        title: doc.title || 'Untitled Project',
        slug: doc.slug,
        updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date()
      }));
      
      console.log('Projects after mapping:', JSON.stringify(projects, null, 2));
    } else {
      console.error('Database connection not available for sitemap');
    }
  } catch (error) {
    console.error('Error fetching projects for sitemap:', error);
    // Continue with empty projects array if database query fails
  }
  
  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/admin/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ] as MetadataRoute.Sitemap;
  
  // Dynamic project routes - include all projects
  const projectRoutes = projects
    .filter(project => {
      // For debugging
      if (!project.slug) {
        console.log(`Project without slug: ${project._id} - ${project.title}`);
      }
      return true; // Include all projects for now
    })
    .map((project) => {
      // Use slug if available, otherwise use ID
      const urlPath = project.slug || project._id;
      return {
        url: `${baseUrl}/projects/${urlPath}`,
        lastModified: project.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      };
    }) as MetadataRoute.Sitemap;
    
  console.log(`Generated ${projectRoutes.length} project routes for sitemap`);
  
  return [...staticRoutes, ...projectRoutes];
}
