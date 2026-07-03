import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import CreateCalibrationDialog from './-components/create-calibration-dialog';
import DeleteCalibrationDialog from './-components/delete-calibration-dialog';
import AcquisitionCard from '@/components/acquisition/acquisition-card';
import CreateAcquisitionCard from '@/components/acquisition/create-acquisition-card';
import { ComponentCardSkeleton } from '@/components/component-card';
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

  const [openCreateCalibrationDialog, setOpenCreateCalibrationDialog] = useState(false);
  const selectedCalibration = calibrations?.find((calibration) => calibration.id === selectedCalibrationId) ?? null;

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
      <DeleteCalibrationDialog
        calibration={selectedCalibration}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
      />
    </div>
  );
}
