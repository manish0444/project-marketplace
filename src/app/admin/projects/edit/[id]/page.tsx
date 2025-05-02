import ProjectForm from '@/components/ProjectForm';
import { Project } from '@/types/project';

async function getProject(id: string): Promise<Project> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch project');
  }

  return res.json();
}

export default async function EditProject({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Project</h1>
      </div>
      
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <ProjectForm mode="edit" project={project} />
        </div>
      </div>
    </div>
  );
}