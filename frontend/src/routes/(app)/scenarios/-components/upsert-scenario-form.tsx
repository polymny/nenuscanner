import { useEffect, useMemo } from 'react';
import { useForm, useFormContext, useFormState } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { vineResolver } from '@hookform/resolvers/vine';
import ShutterSpeedsFormSection from './shutter-speeds-form-section';
import LedsFormSection from './leds-form-section';
import PosesFormSection from './poses-form-section';
import { ScenarioInspectModeProvider } from './scenario-inspect-mode-context';
import ScenarioInspectModeSync from './scenario-inspect-mode-sync';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { upsertScenarioSchema } from '@/schemas/scenario.schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useUpsertScenario } from '@/api/mutations/scenario.mutations';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { useGetLedPowerValues } from '@/api/queries/led-power-value.queries';
import { useGetShutterSpeedValues } from '@/api/queries/shutter-speed-value.queries';
import { SHUTTER_SPEED_REFERENCE } from '@/types/shutter-speed-value.types';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LED_VALUES } from '@/types/led.types';

interface UpsertScenarioFormProps {
  mode: 'create' | 'update';
  scenarioId?: number;
  onRequestDuplicate?: () => void;
}

interface ScenarioFormSubmitButtonProps {
  isUpserting: boolean;
}

const ScenarioFormSubmitButton = ({ isUpserting }: ScenarioFormSubmitButtonProps) => {
  const { control } = useFormContext<UpsertScenarioPayload>();
  const { isValid } = useFormState({ control });

  return (
    <Button disabled={!isValid || isUpserting} size="lg" type="submit">
      Valider
      {isUpserting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
    </Button>
  );
};

const UpsertScenarioFormContent = ({ mode, scenarioId, onRequestDuplicate }: UpsertScenarioFormProps) => {
  const navigate = useNavigate();
  const { data: scenarios } = useGetScenarios();
  const { data: powerOptions = [] } = useGetLedPowerValues();
  const { data: shutterSpeedOptions = [] } = useGetShutterSpeedValues();

  const defaultCreateLeds = useMemo(() => {
    if (powerOptions.length === 0) return null;

    const minPowerId = powerOptions[0].id;
    const maxPowerId = powerOptions[powerOptions.length - 1].id;

    return LED_VALUES.map((value) => ({
      value,
      powerId: value === 'NO_LED' ? minPowerId : maxPowerId,
    }));
  }, [powerOptions]);

  const defaultCreateShutterSpeedIds = useMemo(() => {
    if (shutterSpeedOptions.length === 0) return null;

    const referenceOption = shutterSpeedOptions.find((option) => option.value === SHUTTER_SPEED_REFERENCE);
    return referenceOption ? [referenceOption.id] : null;
  }, [shutterSpeedOptions]);

  const existingScenario = scenarios?.find((scenario) => scenario.id === scenarioId);
  const isLockedForEdition = useMemo(() => {
    if (mode !== 'update') return false;
    return (existingScenario?.acquisitions.length ?? 0) > 0 || (existingScenario?.calibrations.length ?? 0) > 0;
  }, [existingScenario?.acquisitions.length, mode]);

  const { isPending: isUpsertingScenario, mutate: upsertScenarioMutate } = useUpsertScenario(mode, {
    onSuccess: (_, { name }) => {
      toast.success(`${name} a bien été ${mode === 'create' ? 'créé' : 'modifié'}.`);
      navigate({ to: '/scenarios' });
    },
  });

  const form = useForm<UpsertScenarioPayload>({
    resolver: vineResolver(upsertScenarioSchema),
    defaultValues: {
      name: existingScenario?.name ?? '',
      id: existingScenario?.id ?? undefined,
      leds: existingScenario?.leds ?? [],
      posesCount: existingScenario?.posesCount ?? 1,
      shutterSpeedIds: existingScenario?.shutterSpeedIds ?? [],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (mode !== 'create' || !defaultCreateLeds) return;
    form.setValue('leds', defaultCreateLeds, { shouldValidate: true });
  }, [defaultCreateLeds, form, mode]);

  useEffect(() => {
    if (mode !== 'create' || !defaultCreateShutterSpeedIds) return;
    form.setValue('shutterSpeedIds', defaultCreateShutterSpeedIds, { shouldValidate: true });
  }, [defaultCreateShutterSpeedIds, form, mode]);

  return (
    <Form {...form}>
      <ScenarioInspectModeSync />
      <form
        className="flex w-full flex-col items-center gap-8"
        onSubmit={form.handleSubmit((data) => upsertScenarioMutate(data))}
      >
        {isLockedForEdition && (
          <Alert className="border-warning-200 bg-warning-50 text-warning-800 w-3/4">
            <AlertTitle>Édition désactivée</AlertTitle>
            <AlertDescription>
              Ce scénario est déjà utilisé par plusieurs acquisitions. Pour éviter d'impacter l'existant, vous pouvez le
              dupliquer.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
          <h3 className="text-brand-600">Informations générales</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Nom du scénario</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLockedForEdition}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Nom du scénario"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <LedsFormSection disabled={isLockedForEdition} />

        <ShutterSpeedsFormSection disabled={isLockedForEdition} />

        <PosesFormSection disabled={isLockedForEdition} />

        {isLockedForEdition ? (
          <Button size="lg" type="button" onClick={onRequestDuplicate}>
            Dupliquer
          </Button>
        ) : (
          <ScenarioFormSubmitButton isUpserting={isUpsertingScenario} />
        )}
      </form>
    </Form>
  );
};

const UpsertScenarioForm = (props: UpsertScenarioFormProps) => (
  <ScenarioInspectModeProvider>
    <UpsertScenarioFormContent {...props} />
  </ScenarioInspectModeProvider>
);

export default UpsertScenarioForm;
