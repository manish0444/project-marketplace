import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

interface Project {
  _id: string;
  title: string;
  slug?: string;
  updatedAt?: Date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.krishendra.com';
  
  // Connect to database
  const mongo = await connectToDatabase();
  const db = mongo.connection.db;
  
  // Fetch all projects for dynamic routes
  let projects: Project[] = [];
  
  try {
    if (db) {
      const projectDocs = await db
        .collection('projects')
        .find({}, { projection: { _id: 1, title: 1, slug: 1, updatedAt: 1 } })
        .toArray();
      
      // Cast to Project[] with type safety
      projects = projectDocs.map(doc => ({
        _id: doc._id.toString(),
        title: doc.title || 'Untitled Project',
        slug: doc.slug,
        updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date()
      }));
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
  
  // Dynamic project routes
  const projectRoutes = projects.map((project) => {
    return {
      url: `${baseUrl}/projects/${project._id}`,
      lastModified: project.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    };
  }) as MetadataRoute.Sitemap;
  
  return [...staticRoutes, ...projectRoutes];
}
