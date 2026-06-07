// Создание нового проекта
import { ProjectForm } from "@/components/ProjectForm";
import { createProject } from "../../../actions";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Новый проект</h1>
      <ProjectForm action={createProject} />
    </div>
  );
}
