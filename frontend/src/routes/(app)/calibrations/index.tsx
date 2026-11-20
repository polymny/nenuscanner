import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CreateCalibrationDialog from './-components/create-calibration-dialog';
import DeleteCalibrationDialog from './-components/delete-calibration-dialog';
import AcquisitionCard from '@/components/acquisition/acquisition-card';
import CreateAcquisitionCard from '@/components/acquisition/create-acquisition-card';
import { ComponentCardSkeleton } from '@/components/component-card';
import { useGetCalibrations } from '@/api/queries/acquisition.queries';
import { useGetLastRigConfiguration } from '@/api/queries/rig-configuration.queries';
import { useDownloadAcquisitions } from '@/api/mutations/acquisition.mutations';
import SelectionHeader from '@/components/acquisition/selection-header';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';
import { useSelection } from '@/hooks/use-selection';
import { pluralize } from '@/lib/utils';

export const Route = createFileRoute('/(app)/calibrations/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: calibrations, isPending: isLoadingCalibrations } = useGetCalibrations();
  const { data: lastRigConfiguration } = useGetLastRigConfiguration();
  const showSkeleton = useMinimumLoadingDuration(isLoadingCalibrations);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCalibrationId, setSelectedCalibrationId] = useState<null | number>(null);
  const selectableIds = useMemo(
    () => (calibrations ?? []).filter((calibration) => calibration.status === 'COMPLETED').map(({ id }) => id),
    [calibrations]
  );
  const selection = useSelection(selectableIds);
  const selectedCount = selection.selectedIds.length;

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

  const handleCalibrationDownload = useCallback(
    (calibrationId: number) => {
      downloadAcquisitions({ acquisitionIds: [calibrationId] });
    },
    [downloadAcquisitions]
  );

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <SelectionHeader
          downloading={isDownloadingCalibrations}
          onDownload={() => downloadAcquisitions({ acquisitionIds: selection.selectedIds })}
          selectedText={`${selectedCount} ${pluralize(selectedCount, 'étalonnage')} ${pluralize(selectedCount, 'sélectionné')}`}
          selection={selection}
          title="Étalonnages"
          total={selectableIds.length}
        />
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
                dimmed={
                  lastRigConfiguration !== undefined && calibration.rigConfigurationId !== lastRigConfiguration.id
                }
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
                    ? (selected) => selection.toggle(calibration.id, selected)
                    : undefined
                }
                selected={selection.selectedIds.includes(calibration.id)}
                selectionMode={selectedCount > 0}
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
