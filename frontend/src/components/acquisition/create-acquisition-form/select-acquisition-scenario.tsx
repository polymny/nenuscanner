import { useMemo } from 'react';
import { AlertOctagon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { Dispatch } from 'react';

import type { CreateAcquisitionPayload, CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useGetCompatibleScenarios, useGetScenarios } from '@/api/queries/scenario.queries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import DialogBackButton from '@/components/ui/dialog-back-button';
import ScenarioSummaryRow from '@/components/scenario/scenario-summary-row';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

interface SelectAcquisitionScenarioProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<'name' | 'scenario' | 'calibration'>;
  isCalibration?: boolean;
}

const SelectAcquisitionScenario = ({
  setOpen,
  setCurrentStep,
  isCalibration = false,
}: SelectAcquisitionScenarioProps) => {
  const form = useFormContext<CreateAcquisitionPayload | CreateCalibrationPayload>();
  const selectedScenarioId = form.watch('scenarioId');
  const { data: scenarios, isPending: isLoadingScenarios } = useGetScenarios();
  const { data: compatibleScenarios = [] } = useGetCompatibleScenarios(
    selectedScenarioId ?? 0,
    isCalibration && !!selectedScenarioId
  );
  const compatibilityByScenarioId = useMemo(
    () => new Map(compatibleScenarios.map((compatibility) => [compatibility.id, compatibility])),
    [compatibleScenarios]
  );
  const showSkeleton = useMinimumLoadingDuration(isLoadingScenarios);
  const selectedScenario = scenarios?.find((scenario) => scenario.id === selectedScenarioId);
  const hasRotations = (selectedScenario?.rotationsCount ?? 0) > 0;

  return (
    <>
      <DialogHeader>
        <DialogBackButton
          onClick={() => {
            setCurrentStep('name');
          }}
        />
        <DialogTitle>Sélectionner un scénario</DialogTitle>
      </DialogHeader>
      <div className="bg-gray-25 flex h-[70vh] flex-col gap-5 p-6">
        <Alert variant="warning">
          <AlertOctagon className="text-warning-800! size-5" />
          <AlertTitle>Plateau tournant déconnecté</AlertTitle>
          <AlertDescription>
            Le plateau tournant de votre NeNuScanner n'est pas connecté. Vous devrez effectuer les rotations
            manuellement.
          </AlertDescription>
        </Alert>
        <div className="text-sm font-bold text-gray-500">Scénarios disponibles</div>
        {showSkeleton ? (
          <div className="grid w-full grid-cols-2 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingScenarios ? null : !scenarios?.length ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-gray-200">
            <h4 className="font-semibold">Aucun scénario trouvé</h4>
            <span className="text-sm text-gray-600">Allez sur les scénarios et créez votre scénario</span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="scenarioId"
              render={({ field }) => (
                <FormItem className="no-scrollbar grid h-[40vh] w-full overflow-y-scroll py-0.5">
                  <FormControl>
                    <RadioGroup
                      className="h-max grid-cols-2 gap-5"
                      onValueChange={(newValue) => {
                        const scenarioId = Number(newValue);
                        field.onChange(scenarioId);
                        const scenario = scenarios.find((item) => item.id === scenarioId);
                        if (!scenario?.rotationsCount) {
                          form.setValue('withManualRotations', false);
                        }
                      }}
                      value={field.value?.toString() ?? ''}
                    >
                      {scenarios.map((scenario) => {
                        const compatibility = compatibilityByScenarioId.get(scenario.id);
                        const isSelected = scenario.id === selectedScenarioId;

                        return (
                          <FlatRadioGroupItem className="h-max" key={scenario.id} value={scenario.id.toString()}>
                            <ScenarioSummaryRow
                              className="min-w-0 flex-1"
                              compatibility={
                                isCalibration
                                  ? (compatibility ??
                                    (isSelected
                                      ? { sameLeds: true, sameShutterSpeeds: true, sameRotationsCount: true }
                                      : { sameLeds: false, sameShutterSpeeds: false, sameRotationsCount: false }))
                                  : undefined
                              }
                              interactive={false}
                              scenario={scenario}
                            />
                          </FlatRadioGroupItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />
            <FormField
              control={form.control}
              name="withManualRotations"
              render={({ field }) => (
                <FormItem className="flex w-full flex-row items-center gap-2">
                  <FormControl>
                    <Switch
                      className="data-[state=checked]:bg-success-500"
                      checked={field.value}
                      disabled={!hasRotations}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-sm font-medium text-gray-700">
                    Je souhaite effectuer les rotations manuellement
                  </span>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="withRotationAutofocus"
              render={({ field }) => (
                <FormItem className="flex w-full flex-row items-center gap-2">
                  <FormControl>
                    <Switch
                      className="data-[state=checked]:bg-success-500"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-sm font-medium text-gray-700">
                    Je souhaite faire l'autofocus pour chaque pose de l'objet
                  </span>
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
                <Button
                  disabled={!form.watch('scenarioId')}
                  size="lg"
                  type={isCalibration ? 'submit' : 'button'}
                  onClick={
                    isCalibration
                      ? undefined
                      : () => {
                          setCurrentStep('calibration');
                        }
                  }
                >
                  {isCalibration ? 'Créer' : 'Continuer'}
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

export default SelectAcquisitionScenario;
