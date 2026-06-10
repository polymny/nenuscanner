import { useMemo } from 'react';
import { useForm, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { vineResolver } from '@hookform/resolvers/vine';
import ShutterSpeedsFormSection from './shutter-speeds-form-section';
import LedsFormSection from './leds-form-section';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { upsertScenarioSchema } from '@/schemas/scenario.schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { useUpsertScenario } from '@/api/mutations/scenario.mutations';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { useGetShutterSpeedValues } from '@/api/queries/shutter-speed-value.queries';
import { SHUTTER_SPEED_REFERENCE } from '@/types/shutter-speed-value.types';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface UpsertScenarioFormProps {
  mode: 'create' | 'update';
  scenarioId?: number;
  onRequestDuplicate?: () => void;
}

const RotationsCountAlert = () => {
  const { control } = useFormContext<UpsertScenarioPayload>();
  const rotationsCount = useWatch({ control, name: 'rotationsCount' });

  return (
    <Alert className={cn('border-success-200 bg-success-50 text-success-800', rotationsCount === 0 ? '' : 'opacity-0')}>
      <AlertTitle>Compatible sans plateau tournant</AlertTitle>
      <AlertDescription>
        Avec 0 rotation, votre configuration est compatible avec un setup sans plateau tournant.
      </AlertDescription>
    </Alert>
  );
};

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

const UpsertScenarioForm = ({ mode, scenarioId, onRequestDuplicate }: UpsertScenarioFormProps) => {
  const navigate = useNavigate();
  const { data: scenarios } = useGetScenarios();
  const { data: shutterSpeedOptions = [] } = useGetShutterSpeedValues();
  const defaultShutterSpeedId = useMemo(
    () => shutterSpeedOptions.find((option) => option.value === SHUTTER_SPEED_REFERENCE)?.id ?? 0,
    [shutterSpeedOptions]
  );
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
      rotationsCount: existingScenario?.rotationsCount ?? 0,
      shutterSpeedIds: existingScenario?.shutterSpeedIds ?? (mode === 'create' ? [defaultShutterSpeedId] : []),
    },
    mode: 'onChange',
  });

  return (
    <Form {...form}>
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

        <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
          <h3 className="text-brand-600">Gestion des rotations</h3>
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="rotationsCount"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nombre de rotations</FormLabel>
                  <FormControl>
                    <SliderWithLabels
                      wrapperClassName="w-full"
                      minLabel="0"
                      maxLabel="12"
                      currentLabel={String(field.value)}
                      min={0}
                      max={12}
                      step={1}
                      value={[field.value]}
                      disabled={isLockedForEdition}
                      onValueChange={(v) => field.onChange(v[0] ?? 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <RotationsCountAlert />
          </div>
        </div>

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

export default UpsertScenarioForm;
