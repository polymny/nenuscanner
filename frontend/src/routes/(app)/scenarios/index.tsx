import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import DeleteScenarioDialog from './-components/delete-scenario-dialog';
import DuplicateScenarioDialog from './-components/duplicate-scenario-dialog';
import CreateScenarioCalibrationDialog from './-components/create-scenario-calibration-dialog';
import { ScenarioCard } from './-components/scenario-card';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

export const Route = createFileRoute('/(app)/scenarios/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: scenarios, isPending } = useGetScenarios();
  const showSkeleton = useMinimumLoadingDuration(isPending);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<null | number>(null);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [openCalibrateDialog, setOpenCalibrateDialog] = useState(false);

  const selectedScenario = scenarios?.find((scenario) => scenario.id === selectedScenarioId) ?? null;

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <h2 className="font-semibold text-gray-950">Scénarios</h2>
        {showSkeleton ? (
          <div className="grid grid-cols-4 items-start gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isPending ? null : (
          <div className="grid grid-cols-4 items-start gap-5">
            <button
              className="hover:border-brand-400 hover:bg-brand-50 flex h-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-left shadow-sm transition-colors"
              onClick={() => navigate({ to: '/scenarios/create' })}
              type="button"
            >
              <div className="flex items-center justify-center rounded-full border border-gray-200 bg-white p-3">
                <Plus className="text-brand-600 size-5" />
              </div>
              <span className="flex flex-col">
                <span className="text-brand-600 text-sm font-semibold">Nouveau scénario</span>
                <span className="text-subtle text-gray-600">Créer un scénario</span>
              </span>
            </button>
            {scenarios?.map((scenario) => (
              <ScenarioCard
                scenario={scenario}
                key={scenario.id}
                onDuplicate={() => {
                  setSelectedScenarioId(scenario.id);
                  setOpenDuplicateDialog(true);
                }}
                onCalibrate={() => {
                  setSelectedScenarioId(scenario.id);
                  setOpenCalibrateDialog(true);
                }}
                onDelete={() => {
                  setSelectedScenarioId(scenario.id);
                  setOpenDeleteDialog(true);
                }}
              />
            ))}
          </div>
        )}
      </div>
      <DeleteScenarioDialog open={openDeleteDialog} scenario={selectedScenario} setOpen={setOpenDeleteDialog} />
      <DuplicateScenarioDialog
        open={openDuplicateDialog}
        setOpen={setOpenDuplicateDialog}
        sourceScenarioId={selectedScenarioId}
      />
      <CreateScenarioCalibrationDialog
        open={openCalibrateDialog}
        scenario={selectedScenario}
        setOpen={setOpenCalibrateDialog}
      />
    </div>
  );
}
