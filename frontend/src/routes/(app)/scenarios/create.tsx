import { createFileRoute } from '@tanstack/react-router';
import UpsertScenarioForm from './-components/upsert-scenario-form';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';

export const Route = createFileRoute('/(app)/scenarios/create')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <CustomBreadcrumb
        backPageName="Revenir aux scénarios"
        backPagePath="/scenarios"
        currentPageName="Nouveau scénario"
      />
      <h1>Créer un scénario</h1>
      <UpsertScenarioForm mode="create" />
    </div>
  );
}
