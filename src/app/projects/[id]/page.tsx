import ProjectDetailsClient from '@/components/ProjectDetailsClient';
import { Project } from '@/types/project';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

async function getProject(id: string): Promise<Project> {
  // Use absolute URL to ensure API works in all environments
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const absoluteUrl = `${apiBaseUrl}/api/projects/${id}`;
  
  // Add caching for improved performance
  const res = await fetch(absoluteUrl, {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch project');
  }
  return res.json();
}

// Props for the page component and metadata generator
interface PageProps {
  params: { id: string };
}

// Generate metadata for SEO
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the project ID from params
  const { id } = params;
  
  try {
    // Fetch project data
    const project = await getProject(id);
    
    // Get parent metadata (e.g., from layout)
    const previousImages = (await parent).openGraph?.images || [];
    
    return {
      title: `${project.title} | Project Showcase`,
      description: project.description?.substring(0, 160) || 'View project details',
      openGraph: {
        title: project.title,
        description: project.description?.substring(0, 160) || 'View project details',
        images: [...(project.images || []), ...previousImages],
      },
    };
  } catch (error) {
    // Default metadata if project can't be fetched
    return {
      title: 'Project Details | Project Showcase',
      description: 'View project details',
    };
  }
}

export default async function ProjectDetails({ params }: PageProps) {
  // Get the project ID from params
  const { id } = params;
  
  try {
    // Fetch the project
    const project = await getProject(id);
    
    // If project doesn't exist, show 404 page
    if (!project) {
      notFound();
    }
    
    // Calculate base URL for absolute URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const projectUrl = `${baseUrl}/projects/${id}`;
    
    // Get the first image or a placeholder
    const mainImage = project.images && project.images.length > 0 
      ? project.images[0] 
      : `${baseUrl}/images/project-placeholder.jpg`;
    
    return (
      <>
        <ProjectDetailsClient project={project} id={id} />
        
        {/* Structured data for the project */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: project.title,
              description: project.description,
              image: mainImage,
              url: projectUrl,
              ...(project.category && { category: project.category }),
              offers: {
                '@type': 'Offer',
                price: project.price,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                url: projectUrl
              },
              ...(project.rating && project.rating.average > 0 && {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: project.rating.average.toFixed(1),
                  reviewCount: project.rating.count,
                  bestRating: '5',
                  worstRating: '1'
                }
              })
            })
          }}
        />
        
        {/* BreadcrumbList structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: baseUrl
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Projects',
                  item: `${baseUrl}/projects`
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: project.title,
                  item: projectUrl
                }
              ]
            })
          }}
        />
      </>
    );
  } catch (error) {
    // If there's an error fetching the project, show 404 page
    notFound();
  }
}