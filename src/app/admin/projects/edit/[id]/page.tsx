'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import ProjectForm from '@/components/ProjectForm';
import toast from 'react-hot-toast';

// Use a simple function component with inline type definition
export default function EditProject({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/projects/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await res.json();
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
        router.push('/admin/projects');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProject();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading project...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">Project not found</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Edit Project</h1>
      <ProjectForm project={project} mode="edit" />
    </div>
  );
}