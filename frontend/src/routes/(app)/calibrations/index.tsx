import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import CreateCalibrationDialog from './-components/create-calibration-dialog';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import AcquisitionCard from '@/components/acquisition/acquisition-card';
import CreateAcquisitionCard from '@/components/acquisition/create-acquisition-card';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useDeleteAcquisition } from '@/api/mutations/acquisition.mutations';
import { useGetCalibrations } from '@/api/queries/acquisition.queries';
import { useGetLastArmsPosition } from '@/api/queries/arms-position.queries';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

export const Route = createFileRoute('/(app)/calibrations/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: calibrations, isPending: isLoadingCalibrations } = useGetCalibrations();
  const { data: lastArmsPosition } = useGetLastArmsPosition();
  const showSkeleton = useMinimumLoadingDuration(isLoadingCalibrations);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState<null | number>(null);

  const { mutate: deleteCalibration } = useDeleteAcquisition({
    onSuccess: () => {
      toast.success('Étalonnage supprimé.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  const [openCreateCalibrationDialog, setOpenCreateCalibrationDialog] = useState(false);

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <h2 className="font-semibold text-gray-950">Étalonnages</h2>
        {showSkeleton ? (
          <div className="grid grid-cols-4 items-start gap-x-6 gap-y-8">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingCalibrations ? null : (
          <div className="grid grid-cols-4 items-start gap-x-6 gap-y-8">
            <CreateAcquisitionCard
              description="Créer un étalonnage"
              label="Nouvel étalonnage"
              onClick={() => setOpenCreateCalibrationDialog(true)}
            />
            {calibrations?.map((calibration) => (
              <AcquisitionCard
                acquisition={calibration}
                dimmed={lastArmsPosition !== undefined && calibration.armsPositionId !== lastArmsPosition.id}
                key={calibration.id}
                onClick={() => navigate({ to: `/acquisitions/${calibration.id}` })}
                onDelete={() => {
                  setSelectedCalibrationId(calibration.id);
                  setOpenDeleteDialog(true);
                }}
              />
            ))}
          </div>
        )}
      </div>
      <CreateCalibrationDialog open={openCreateCalibrationDialog} setOpen={setOpenCreateCalibrationDialog} />
      <ConfirmActionDialog
        confirmButtonContent="Supprimer"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Voulez-vous vraiment supprimer cet étalonnage ? Cette action ne peut pas être annulée."
        handleConfirmAction={() => {
          if (selectedCalibrationId) deleteCalibration(selectedCalibrationId);
        }}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        title="Supprimer l'étalonnage"
      />
    </div>
  );
}
