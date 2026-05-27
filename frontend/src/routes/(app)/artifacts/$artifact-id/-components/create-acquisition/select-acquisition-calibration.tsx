import { useFormContext } from 'react-hook-form';
import { Camera } from 'lucide-react';
import type { Dispatch } from 'react';

import type { CreateAcquisitionStep } from './create-acquisition-dialog';
import type { CreateAcquisitionPayload } from '@/schemas/acquisition.schemas';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useGetCalibrations } from '@/api/queries/acquisition.queries';
import { ComponentCardSkeleton } from '@/components/component-card';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

interface SelectAcquisitionCalibrationProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<CreateAcquisitionStep>;
}

const SelectAcquisitionCalibration = ({ setOpen, setCurrentStep }: SelectAcquisitionCalibrationProps) => {
  const form = useFormContext<CreateAcquisitionPayload>();
  const { data: calibrations, isPending: isLoadingCalibrations } = useGetCalibrations({
    onlyCurrentArmsPosition: true,
    scenarioId: form.getValues('scenarioId') ?? undefined,
    status: 'COMPLETED',
  });
  const showSkeleton = useMinimumLoadingDuration(isLoadingCalibrations);

  return (
    <>
      <DialogHeader>
        <DialogBackButton
          onClick={() => {
            setCurrentStep('scenario');
          }}
        />
        <DialogTitle>Sélectionner un étalonnage</DialogTitle>
      </DialogHeader>
      <div className="bg-gray-25 flex h-[70vh] flex-col gap-5 p-6">
        <div className="text-sm font-bold text-gray-500">Étalonnages disponibles</div>
        {showSkeleton ? (
          <div className="grid w-full grid-cols-2 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingCalibrations ? null : !calibrations?.length ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-gray-200">
            <h4 className="font-semibold">Aucun étalonnage trouvé</h4>
            <span className="text-sm text-gray-600">Allez sur les étalonnages et créez votre étalonnage</span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="calibrationId"
              render={({ field }) => (
                <FormItem className="no-scrollbar grid h-[40vh] w-full overflow-y-scroll py-0.5">
                  <FormControl>
                    <RadioGroup className="grid-cols-2 gap-5" value={field.value?.toString() ?? ''}>
                      {calibrations.map((calibration) => {
                        return (
                          <FlatRadioGroupItem
                            onClick={() => {
                              if (field.value === calibration.id) {
                                field.onChange(null);
                              } else {
                                field.onChange(calibration.id);
                              }
                            }}
                            className="h-max"
                            key={calibration.id}
                            value={calibration.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <div className="bg-brand-600 rounded-full p-2">
                                <Camera className="size-4 text-white" />
                              </div>
                              <div className="text-sm font-semibold text-gray-700">{calibration.name}</div>
                            </div>
                          </FlatRadioGroupItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
      <FormField
        name="root"
        render={() => (
          <FormItem>
            <DialogFooter className="flex-col">
              <div className="flex justify-between">
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button size="lg" type="submit">
                  Créer
                </Button>
              </div>
              <FormMessage className="text-end" />
            </DialogFooter>
          </FormItem>
        )}
      />
    </>
  );
};

export default SelectAcquisitionCalibration;
