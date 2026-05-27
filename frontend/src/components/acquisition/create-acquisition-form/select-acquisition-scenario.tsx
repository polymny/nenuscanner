import { AlertOctagon, Clapperboard } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { Dispatch } from 'react';

import type { CreateAcquisitionPayload, CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import DialogBackButton from '@/components/ui/dialog-back-button';

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
  const { data: scenarios, isPending: isLoadingScenarios } = useGetScenarios();

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
        {isLoadingScenarios ? (
          <div className="grid w-full grid-cols-2 gap-5">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : !scenarios?.length ? (
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
                      className="grid-cols-2 gap-5"
                      onValueChange={(newValue) => {
                        field.onChange(Number(newValue));
                      }}
                      value={field.value?.toString() ?? ''}
                    >
                      {scenarios.map((scenario) => {
                        return (
                          <FlatRadioGroupItem className="h-max" key={scenario.id} value={scenario.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="bg-brand-600 rounded-full p-2">
                                <Clapperboard className="size-4 text-white" />
                              </div>
                              <div className="text-sm font-semibold text-gray-700">{scenario.name}</div>
                            </div>
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
