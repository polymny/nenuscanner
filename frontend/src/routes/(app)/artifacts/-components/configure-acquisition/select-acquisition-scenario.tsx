import { AlertOctagon, Clapperboard } from 'lucide-react';
import type { Dispatch } from 'react';

import type { ConfigureAcquisitionStep } from './configure-acquisition-dialog';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface SelectAcquisitionScenarioProps {
  setWithRotationAutofocus: Dispatch<boolean>;
  withRotationAutofocus: boolean;
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<ConfigureAcquisitionStep>;
  setSelectedScenarioId: Dispatch<number>;
  selectedScenarioId: number | null;
}

const SelectAcquisitionScenario = ({
  setWithRotationAutofocus,
  withRotationAutofocus,
  setOpen,
  setCurrentStep,
  setSelectedScenarioId,
  selectedScenarioId,
}: SelectAcquisitionScenarioProps) => {
  const { data: scenarios, isPending: isLoadingScenarios } = useGetScenarios();

  return (
    <>
      <DialogHeader>
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
            <RadioGroup
              className="no-scrollbar grid h-[40vh] w-full grid-cols-2 gap-5 overflow-y-scroll py-0.5"
              onValueChange={(newValue) => {
                setSelectedScenarioId(Number(newValue));
              }}
              value={selectedScenarioId?.toString()}
            >
              {[
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
                ...scenarios,
              ].map((scenario) => {
                return (
                  <FlatRadioGroupItem key={scenario.id} value={scenario.id.toString()}>
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
            <Separator />
            <div className="flex items-center gap-2">
              <Switch
                className="data-[state=checked]:bg-success-500"
                checked={withRotationAutofocus}
                onCheckedChange={setWithRotationAutofocus}
              />
              <span className="text-sm font-medium text-gray-700">
                Je souhaite refaire l'autofocus après chaque rotation du plateau tournant
              </span>
            </div>
          </div>
        )}
      </div>
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
            disabled={!selectedScenarioId}
            size="lg"
            type="button"
            onClick={() => {
              setCurrentStep('calibration');
            }}
          >
            Continuer
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};

export default SelectAcquisitionScenario;
