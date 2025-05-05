'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Define a safe project type to avoid undefined errors
interface SafeProject {
  _id: string;
  title: string;
  projectType: string;
  price: number;
  createdAt: string;
  images: string[];
  forSale: boolean;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<SafeProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await res.json();

      // Ensure data is an array and sanitize it to prevent undefined errors
      if (Array.isArray(data)) {
        const safeProjects = data.map(project => ({
          _id: project?._id || '',
          title: project?.title || 'Untitled Project',
          projectType: project?.projectType || '-',
          price: typeof project?.price === 'number' ? project.price : 0,
          createdAt: project?.createdAt || '',
          images: Array.isArray(project?.images) ? project.images : [],
          forSale: typeof project?.forSale === 'boolean' ? project.forSale : true
        }));

        setProjects(safeProjects);
      } else {
        console.error('API returned non-array data:', data);
        setProjects([]);
        toast.error('Invalid data format received from server');
      }
    } catch (error: unknown) {
      console.error('Error fetching projects:', error);
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      toast.error(message);
      setProjects([]); // Ensure projects is always an array
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!id || !window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      toast.error(message);
    }
  }

  // Helper function to ensure image paths are properly formatted
  const getImageSrc = (path: string): string => {
    if (!path) return '/window.svg'; // Fallback image using existing svg

    // If it's already an absolute URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If it's a relative path without a leading slash, add one
    if (!path.startsWith('/')) {
      return `/${path}`;
    }

    return path;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm rounded-md text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading projects...
        </div>
      </div>
    );
  }

  // Render projects list
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Project
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700/50 rounded-lg overflow-x-auto">
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No projects found. Click "Add Project" to create your first project.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">
                  Project
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                  Type
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                  Price
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                  For Sale
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                  Created
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {projects.map((project) => (
                <tr key={project._id || Math.random().toString()}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative">
                        {project.images && project.images.length > 0 ? (
                          <Image
                            src={getImageSrc(project.images[0])}
                            alt={project.title || 'Project image'}
                            fill
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{project.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {project.projectType}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {`$${project.price.toLocaleString()}`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.forSale
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {project.forSale ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-2">
                      {project._id && (
                        <>
                          <Link
                            href={`/admin/projects/edit/${project._id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(project._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
