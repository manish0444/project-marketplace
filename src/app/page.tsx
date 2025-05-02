'use client';

import { useState, useEffect } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types/project';

function getProjects(): Promise<{ projects: Project[]; error?: string }> {
  return fetch('/api/projects', {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      return res.json();
    })
    .then((projects) => ({ projects }))
    .catch((error) => {
      console.error('Error fetching projects:', error);
      return { 
        projects: [],
        error: 'Failed to load projects. Please try again later.' 
      };
    });
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Set up global filter state handlers
  useEffect(() => {
    // Make these handlers available globally
    window.handleCategoryChange = (newCategory: string) => {
      setCategory(newCategory);
    };
    
    window.handleSortChange = (newSortBy: string) => {
      setSortBy(newSortBy);
    };
    
    window.handleSearchChange = (newSearchQuery: string) => {
      setSearchQuery(newSearchQuery);
    };
    
    return () => {
      // Clean up global handlers - using type assertion to avoid TypeScript errors
      window.handleCategoryChange = undefined as any;
      window.handleSortChange = undefined as any;
      window.handleSearchChange = undefined as any;
    };
  }, []);

  // Fetch projects on component mount
  useEffect(() => {
    setIsLoading(true);
    getProjects()
      .then(({ projects, error }) => {
        setProjects(projects);
        setFilteredProjects(projects);
        if (error) setError(error);
        setIsLoading(false);
      });
  }, []);

  // Apply filters and sorting whenever any filter criteria changes
  useEffect(() => {
    let result = [...projects];

    // Apply category filter (assuming projectType is the category field)
    if (category !== 'All') {
      result = result.filter(project => project.projectType === category);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(project => 
        project.title.toLowerCase().includes(query) || 
        project.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result = result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          // Assuming there's a views field, or fallback to 0
          return ((b as any).views || 0) - ((a as any).views || 0);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredProjects(result);
  }, [projects, category, sortBy, searchQuery]);

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          

          <div className="mt-12">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 dark:bg-red-950/30 bg-red-50 p-4 rounded-lg">
                {error}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center dark:text-gray-400 text-gray-500 p-10 rounded-lg dark:bg-gray-800/50 bg-gray-100/50">
                {searchQuery || category !== 'All' ? 
                  'No projects match your current filters.' : 
                  'No projects available yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add TypeScript declaration for global filter handlers
declare global {
  interface Window {
    handleCategoryChange: (category: string) => void;
    handleSortChange: (sortBy: string) => void;
    handleSearchChange: (searchQuery: string) => void;
  }
}
