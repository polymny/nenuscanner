import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import { Camera } from 'lucide-react';
import CreateCalibrationDialog from './-components/create-calibration-dialog';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import AcquisitionCard from '@/components/acquisition/acquisition-card';
import { Button } from '@/components/ui/button';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useDeleteAcquisition } from '@/api/mutations/acquisition.mutations';
import { useGetCalibrations } from '@/api/queries/acquisition.queries';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

export const Route = createFileRoute('/(app)/calibrations/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: calibrations, isPending: isLoadingCalibrations } = useGetCalibrations();
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
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-gray-950">Étalonnages</h2>
          {!showSkeleton && !!calibrations?.length && (
            <Button onClick={() => setOpenCreateCalibrationDialog(true)}>Créer un étalonnage</Button>
          )}
        </div>
        {showSkeleton ? (
          <div className="grid grid-cols-3 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingCalibrations ? null : !calibrations?.length ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="size-max rounded-full border border-gray-200 bg-white p-3">
              <Camera className="text-brand-600 size-6" />
            </div>
            <h4 className="font-semibold">Aucun étalonnage trouvé</h4>
            <Button onClick={() => setOpenCreateCalibrationDialog(true)}>Créer un étalonnage</Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 items-start gap-5">
            {calibrations.map((calibration) => (
              <AcquisitionCard
                acquisition={calibration}
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
