import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { toast } from 'sonner';
import DuplicateScenarioDialog from './-components/duplicate-scenario-dialog';
import { ComponentCard, ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { useDeleteScenario } from '@/api/mutations/scenario.mutations';
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

  const { mutate: deleteScenario } = useDeleteScenario({
    onSuccess: () => {
      toast.success('Scénario supprimé.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

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
              <ComponentCard
                name={scenario.name}
                key={scenario.id}
                onClickPath={`/scenarios/${scenario.id}`}
                onDuplicate={() => {
                  setSelectedScenarioId(scenario.id);
                  setOpenDuplicateDialog(true);
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
      <ConfirmActionDialog
        confirmButtonContent="Supprimer"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Voulez-vous vraiment supprimer ce scénario ? Cette action ne peut pas être annulée."
        handleConfirmAction={() => {
          if (selectedScenarioId) deleteScenario(selectedScenarioId);
        }}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        title="Supprimer le scénario"
      />
      <DuplicateScenarioDialog
        open={openDuplicateDialog}
        setOpen={setOpenDuplicateDialog}
        sourceScenarioId={selectedScenarioId}
      />
    </div>
  );
}
