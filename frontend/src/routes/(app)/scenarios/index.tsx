import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import DeleteScenarioDialog from './-components/delete-scenario-dialog';
import DuplicateScenarioDialog from './-components/duplicate-scenario-dialog';
import CreateScenarioCalibrationDialog from './-components/create-scenario-calibration-dialog';
import { ScenarioCard } from './-components/scenario-card';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
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
    <div className="bg-gray-25 flex h-full flex-col items-center gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-gray-950">Scénarios</h2>
          {!showSkeleton && !!scenarios?.length && (
            <Button
              onClick={() => {
                navigate({
                  to: '/scenarios/create',
                });
              }}
            >
              Créer un scénario
            </Button>
          )}
        </div>
        {showSkeleton ? (
          <div className="grid grid-cols-3 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isPending ? null : !scenarios?.length ? (
          <div className="flex justify-center">
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="size-max rounded-full border border-gray-200 bg-white p-3">
                <Clapperboard className="text-brand-600 size-6" />
              </div>
              <h4 className="font-semibold">Aucun scénario trouvé</h4>
              <Button
                onClick={() => {
                  navigate({
                    to: '/scenarios/create',
                  });
                }}
              >
                Créer un scénario
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {scenarios.map((scenario) => (
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
