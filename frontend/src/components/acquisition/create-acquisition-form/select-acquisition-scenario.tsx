import { useMemo } from 'react';
import { AlertOctagon, CircleCheck, Clapperboard } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { Dispatch } from 'react';

import type { CreateAcquisitionPayload, CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useGetCompatibleScenarioIds, useGetScenarios } from '@/api/queries/scenario.queries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';
import ScenarioSummaryStats from '@/components/scenario/scenario-summary-stats';
import { cn } from '@/lib/utils';

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
  const { data: compatibleScenarioIds = [] } = useGetCompatibleScenarioIds(
    selectedScenarioId ?? 0,
    isCalibration && !!selectedScenarioId
  );
  const compatibleScenarios = useMemo(
    () =>
      (scenarios ?? [])
        .filter((scenario) => compatibleScenarioIds.includes(scenario.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [compatibleScenarioIds, scenarios]
  );
  const showSkeleton = useMinimumLoadingDuration(isLoadingScenarios);

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
            Le plateau tournant de votre NeNuScanner n'est pas connecté. Vous ne pourrez utiliser que les scénarios sans
            rotation.
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
                        field.onChange(Number(newValue));
                      }}
                      value={field.value?.toString() ?? ''}
                    >
                      {scenarios.map((scenario) => {
                        const isCompatible =
                          isCalibration && !!selectedScenarioId && compatibleScenarioIds.includes(scenario.id);

                        return (
                          <FlatRadioGroupItem
                            className={cn('h-max', isCompatible && 'border-success-300 bg-success-50')}
                            key={scenario.id}
                            value={scenario.id.toString()}
                          >
                            <div className="flex items-center gap-3 divide-x divide-gray-200">
                              <div className="inline-flex items-center gap-2 px-2">
                                <div className="bg-brand-600 flex rounded-full p-2">
                                  <Clapperboard className="size-4 text-white" />
                                </div>
                                <div
                                  title={scenario.name}
                                  className="wrap-break-words max-w-[100px] overflow-hidden text-sm font-medium text-ellipsis text-gray-700"
                                >
                                  {scenario.name}
                                </div>
                              </div>
                              <ScenarioSummaryStats scenario={scenario} />
                            </div>
                          </FlatRadioGroupItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {isCalibration && compatibleScenarios.length > 0 && (
              <Alert className="border-success-200 bg-success-50 text-success-800">
                <CircleCheck className="text-success-800! size-5" />
                <AlertTitle>Étalonnage étendu</AlertTitle>
                <AlertDescription>
                  {compatibleScenarios.length === 1
                    ? 'Le scénario suivant sera également étalonné automatiquement : '
                    : 'Les scénarios suivants seront également étalonnés automatiquement : '}
                  <span className="font-semibold">
                    {compatibleScenarios.map((scenario) => scenario.name).join(', ')}
                  </span>
                  .
                </AlertDescription>
              </Alert>
            )}

            <Separator />
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
                    Je souhaite refaire l'autofocus après chaque rotation du plateau tournant
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
