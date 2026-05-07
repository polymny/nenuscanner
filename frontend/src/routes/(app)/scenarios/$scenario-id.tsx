import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import UpsertScenarioForm from './-components/upsert-scenario-form';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';

export const Route = createFileRoute('/(app)/scenarios/$scenario-id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'scenario-id': scenarioId } = Route.useParams();
  const navigate = useNavigate();
  const { data: scenarios, isPending: isLoadingScenarios } = useGetScenarios();
  const existingScenario = useMemo(
    () => scenarios?.find((scenario) => scenario.id === Number(scenarioId)),
    [scenarios, scenarioId]
  );

  if (!isLoadingScenarios && !existingScenario) {
    navigate({ to: '/scenarios' });
    return null;
  }

  if (!existingScenario) return <></>;

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <CustomBreadcrumb
        backPageName="Revenir aux scénarios"
        backPagePath="/scenarios"
        currentPageName={existingScenario.name}
      />
      <h1>{existingScenario.name}</h1>
      <UpsertScenarioForm mode="update" scenarioId={existingScenario.id} />
    </div>
  );
}
