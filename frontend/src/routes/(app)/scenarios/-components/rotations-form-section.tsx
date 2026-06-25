import { useFormContext, useWatch } from 'react-hook-form';
import { useScenarioInspectModeTarget } from './scenario-inspect-mode-context';
import InspectModeToggle from './inspect-mode-toggle';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface RotationsFormSectionProps {
  disabled?: boolean;
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

const RotationsFormSection = ({ disabled = false }: RotationsFormSectionProps) => {
  const form = useFormContext<UpsertScenarioPayload>();
  const { isInspectMode, toggleInspectMode } = useScenarioInspectModeTarget('rotations');

  return (
    <div
      className={cn(
        'flex w-3/4 flex-col gap-8 rounded-lg border border-transparent bg-white p-6 shadow-lg transition-colors',
        isInspectMode && 'border-warning-400 bg-warning-50/50'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-brand-600">Gestion des rotations</h3>
        <InspectModeToggle active={isInspectMode} onToggle={toggleInspectMode} />
      </div>
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
                  disabled={disabled}
                  rangeBgColor={isInspectMode ? 'bg-warning-500' : undefined}
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
  );
};

export default RotationsFormSection;
