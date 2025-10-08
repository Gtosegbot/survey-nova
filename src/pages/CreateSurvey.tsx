import { CreateSurveyForm } from "@/components/sections/CreateSurveyForm";

export default function CreateSurvey() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Criar Pesquisa Manualmente</h1>
        <p className="text-muted-foreground">
          Configure sua pesquisa personalizada com controle total
        </p>
      </div>
      <CreateSurveyForm />
    </div>
  );
}
