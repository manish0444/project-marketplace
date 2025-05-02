import ProjectForm from "@/components/ProjectForm";

export default function NewProject() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Create New Project
        </h1>
      </div>

      <div className="px-4 py-6 sm:p-8">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
