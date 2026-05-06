import { useForm } from 'react-hook-form';
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
import { cn } from '@/lib/utils';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { useUpsertScenario } from '@/api/mutations/scenario.mutations';
import { useGetScenarios } from '@/api/queries/scenario.queries';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UpsertScenarioFormProps {
  mode: 'create' | 'update';
  scenarioId?: number;
}

const UpsertScenarioForm = ({ mode, scenarioId }: UpsertScenarioFormProps) => {
  const navigate = useNavigate();
  const { data: scenarios } = useGetScenarios();
  const existingScenario = scenarios?.find((scenario) => scenario.id === scenarioId);

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
      shutterSpeeds: existingScenario?.shutterSpeeds ?? [],
    },
    mode: 'onChange',
  });

  const rotationsCountWatch = form.watch('rotationsCount');

  return (
    <Form {...form}>
      <form
        className="flex w-full flex-col items-center gap-8"
        onSubmit={form.handleSubmit((data) => upsertScenarioMutate(data))}
      >
        <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
          <h3 className="text-brand-600">Informations générales</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input value={field.value} onChange={field.onChange} placeholder="Nom du scénario" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <LedsFormSection />

        <ShutterSpeedsFormSection />

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
                      onValueChange={(v) => field.onChange(v[0] ?? 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Alert
              className={cn(
                'border-success-200 bg-success-50 text-success-800',
                rotationsCountWatch === 0 ? '' : 'opacity-0'
              )}
            >
              <AlertTitle>Compatible sans plateau tournant</AlertTitle>
              <AlertDescription>
                Avec 0 rotation, votre configuration est compatible avec un setup sans plateau tournant.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Button disabled={!form.formState.isValid || isUpsertingScenario} size="lg" type="submit">
          Valider
          {isUpsertingScenario && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </form>
    </Form>
  );
};

export default UpsertScenarioForm;
