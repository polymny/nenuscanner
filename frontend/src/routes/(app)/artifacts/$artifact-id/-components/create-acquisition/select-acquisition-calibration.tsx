import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Camera, Hourglass, RotateCw } from 'lucide-react';
import type { Dispatch } from 'react';

import type { CreateAcquisitionStep } from './create-acquisition-dialog';
import type { CreateAcquisitionPayload } from '@/schemas/acquisition.schemas';
import type { ScenarioCompatibility } from '@/types/scenario.types';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useGetCalibrations } from '@/api/queries/acquisition.queries';
import { useGetCompatibleScenarios } from '@/api/queries/scenario.queries';
import { ComponentCardSkeleton } from '@/components/component-card';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';
import { ScenarioLedIcon } from '@/components/scenario/scenario-led-icon';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export interface CompatibilityCriteria {
  sameLeds: boolean;
  sameShutterSpeeds: boolean;
  sameRotationsCount: boolean;
}

export function matchesCompatibilityCriteria(
  compatibility: ScenarioCompatibility,
  criteria: CompatibilityCriteria
): boolean {
  return (
    (!criteria.sameLeds || compatibility.sameLeds) &&
    (!criteria.sameShutterSpeeds || compatibility.sameShutterSpeeds) &&
    (!criteria.sameRotationsCount || compatibility.sameRotationsCount)
  );
}

interface SelectAcquisitionCalibrationProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<CreateAcquisitionStep>;
}

const SelectAcquisitionCalibration = ({ setOpen, setCurrentStep }: SelectAcquisitionCalibrationProps) => {
  const form = useFormContext<CreateAcquisitionPayload>();
  const selectedScenarioId = form.watch('scenarioId');

  const [compatibilityCriteria, setCompatibilityCriteria] = useState<CompatibilityCriteria>({
    sameLeds: true,
    sameShutterSpeeds: true,
    sameRotationsCount: true,
  });

  const { data: compatibleScenarios = [] } = useGetCompatibleScenarios(selectedScenarioId ?? 0, !!selectedScenarioId);
  const compatibilityByScenarioId = useMemo(
    () => new Map(compatibleScenarios.map((compatibility) => [compatibility.id, compatibility])),
    [compatibleScenarios]
  );

  const { data: calibrations = [], isPending: isLoadingCalibrations } = useGetCalibrations({
    onlyCurrentArmsPosition: true,
    status: 'COMPLETED',
  });
  const filteredCalibrations = useMemo(() => {
    if (!selectedScenarioId) return [];

    return calibrations.filter((calibration) => {
      if (calibration.scenario.id === selectedScenarioId) return true;

      const compatibility = compatibilityByScenarioId.get(calibration.scenario.id);
      if (!compatibility) return false;

      return matchesCompatibilityCriteria(compatibility, compatibilityCriteria);
    });
  }, [calibrations, compatibilityByScenarioId, compatibilityCriteria, selectedScenarioId]);

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
        <div className="flex flex-col gap-3">
          <div className="text-sm font-bold text-gray-500">Critères de compatibilité</div>
          <div className="flex flex-col gap-2">
            <div className="flex w-full flex-row items-center gap-2">
              <Switch
                checked={compatibilityCriteria.sameLeds}
                className="data-[state=checked]:bg-success-500"
                onCheckedChange={(checked) => {
                  setCompatibilityCriteria((current) => ({ ...current, sameLeds: checked }));
                }}
              />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                Mêmes LEDs (puissance + valeur)
                <ScenarioLedIcon ledValue="1" />
              </span>
            </div>
            <div className="flex w-full flex-row items-center gap-2">
              <Switch
                checked={compatibilityCriteria.sameShutterSpeeds}
                className="data-[state=checked]:bg-success-500"
                onCheckedChange={(checked) => {
                  setCompatibilityCriteria((current) => ({ ...current, sameShutterSpeeds: checked }));
                }}
              />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                Mêmes temps de pose
                <Hourglass className="size-4 text-cyan-600" />
              </span>
            </div>
            <div className="flex w-full flex-row items-center gap-2">
              <Switch
                checked={compatibilityCriteria.sameRotationsCount}
                className="data-[state=checked]:bg-success-500"
                onCheckedChange={(checked) => {
                  setCompatibilityCriteria((current) => ({ ...current, sameRotationsCount: checked }));
                }}
              />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                Même nombre de rotations
                <RotateCw className="size-4 text-violet-600" />
              </span>
            </div>
          </div>
        </div>
        <Separator />
        <div className="text-sm font-bold text-gray-500">Étalonnages disponibles</div>
        {showSkeleton ? (
          <div className="grid w-full grid-cols-2 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingCalibrations ? null : !filteredCalibrations.length ? (
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
                    <RadioGroup className="h-max grid-cols-2 gap-5" value={field.value?.toString() ?? ''}>
                      {filteredCalibrations.map((calibration) => {
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
                              <div className="max-w-[300px] overflow-hidden text-sm font-semibold text-ellipsis text-gray-700">
                                {calibration.name}
                              </div>
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
