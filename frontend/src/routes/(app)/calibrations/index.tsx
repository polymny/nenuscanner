import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import CreateCalibrationDialog from './-components/create-calibration-dialog';
import DeleteCalibrationDialog from './-components/delete-calibration-dialog';
import AcquisitionCard from '@/components/acquisition/acquisition-card';
import CreateAcquisitionCard from '@/components/acquisition/create-acquisition-card';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useGetCalibrations } from '@/api/queries/acquisition.queries';
import { useGetLastArmsPosition } from '@/api/queries/arms-position.queries';
import { useDownloadAcquisitions } from '@/api/mutations/acquisition.mutations';
import { Button } from '@/components/ui/button';
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
  const [multiSelectedCalibrationIds, setMultiSelectedCalibrationIds] = useState<Array<number>>([]);

  const { mutate: downloadAcquisitions, isPending: isDownloadingCalibrations } = useDownloadAcquisitions({
    onSuccess: () => {
      toast.success('Téléchargement des étalonnages terminé.');
    },
    onError: () => {
      toast.error('Le téléchargement a échoué.');
    },
  });

  const [openCreateCalibrationDialog, setOpenCreateCalibrationDialog] = useState(false);
  const selectedCalibration = calibrations?.find((calibration) => calibration.id === selectedCalibrationId) ?? null;

  const handleCalibrationSelect = useCallback((calibrationId: number, selected: boolean) => {
    setMultiSelectedCalibrationIds((previous) =>
      selected ? [...previous, calibrationId] : previous.filter((id) => id !== calibrationId)
    );
  }, []);

  const handleCalibrationDownload = useCallback(
    (calibrationId: number) => {
      downloadAcquisitions({ acquisitionIds: [calibrationId] });
    },
    [downloadAcquisitions]
  );

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-gray-950">Étalonnages</h2>
          {!showSkeleton && (
            <Button
              disabled={multiSelectedCalibrationIds.length === 0 || isDownloadingCalibrations}
              onClick={() => downloadAcquisitions({ acquisitionIds: multiSelectedCalibrationIds })}
              variant="outline"
            >
              Télécharger les étalonnages
            </Button>
          )}
        </div>
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
                onDownload={
                  calibration.status === 'COMPLETED' ? () => handleCalibrationDownload(calibration.id) : undefined
                }
                onSelect={
                  calibration.status === 'COMPLETED'
                    ? (selected) => handleCalibrationSelect(calibration.id, selected)
                    : undefined
                }
                selected={multiSelectedCalibrationIds.includes(calibration.id)}
              />
            ))}
          </div>
        )}
      </div>
      <CreateCalibrationDialog open={openCreateCalibrationDialog} setOpen={setOpenCreateCalibrationDialog} />
      <DeleteCalibrationDialog
        calibration={selectedCalibration}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
      />
    </div>
  );
}
