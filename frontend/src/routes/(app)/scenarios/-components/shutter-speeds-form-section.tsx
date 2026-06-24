import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { XCircle } from 'lucide-react';
import { useScenarioInspectMode, useScenarioInspectModeTarget } from './scenario-inspect-mode-context';
import InspectModeToggle from './inspect-mode-toggle';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { BadgeWithAction } from '@/components/ui/badge-with-action';
import { cn, formatNumberAsFractionOrDecimal } from '@/lib/utils';
import { useGetShutterSpeedValues } from '@/api/queries/shutter-speed-value.queries';
import { SHUTTER_SPEED_REFERENCE } from '@/types/shutter-speed-value.types';

interface ShutterSpeedsFormSectionProps {
  disabled?: boolean;
}

const ShutterSpeedsFormSection = ({ disabled = false }: ShutterSpeedsFormSectionProps) => {
  const { data: options = [], isLoading } = useGetShutterSpeedValues();
  const { setShutterSpeedPreviewValue } = useScenarioInspectMode();
  const { isInspectMode, toggleInspectMode } = useScenarioInspectModeTarget('shutter-speeds');

  const [shutterSpeedIndex, setShutterSpeedIndex] = useState<number | null>(null);
  const referenceIndex = Math.max(
    0,
    options.findIndex((option) => option.value === SHUTTER_SPEED_REFERENCE)
  );
  const activeIndex = shutterSpeedIndex ?? referenceIndex;
  const selectedOption = options[activeIndex];

  const form = useFormContext<UpsertScenarioPayload>();
  const shutterSpeedIdsWatch = useWatch({
    control: form.control,
    name: 'shutterSpeedIds',
  });

  const valueById = useMemo(() => new Map(options.map((option) => [option.id, option.value])), [options]);
  const sortShutterSpeedIdsByValue = (ids: Array<number>) =>
    [...ids].filter((id) => valueById.has(id)).sort((a, b) => (valueById.get(a) ?? 0) - (valueById.get(b) ?? 0));
  const sortedShutterSpeedIdsWatch = useMemo(
    () => sortShutterSpeedIdsByValue(shutterSpeedIdsWatch),
    [shutterSpeedIdsWatch, valueById]
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (selectedOption) setShutterSpeedPreviewValue(selectedOption.value);
  }, [selectedOption, setShutterSpeedPreviewValue]);

  if (isLoading || options.length === 0) {
    return (
      <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-brand-600">Gestion des temps de pose</h3>
        <p className="text-muted-foreground text-sm">Chargement des temps de pose disponibles…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-3/4 flex-col gap-8 rounded-lg border border-transparent bg-white p-6 shadow-lg transition-colors',
        isInspectMode && 'border-warning-400 bg-warning-50/50'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-brand-600">Gestion des temps de pose</h3>
        <InspectModeToggle active={isInspectMode} onToggle={toggleInspectMode} />
      </div>
      <div className="flex flex-col gap-3">
        <FormLabel>Veuillez sélectionner au moins un temps de pose</FormLabel>
        <div className="flex items-start gap-4">
          <SliderWithLabels
            wrapperClassName="flex-1"
            minLabel={formatNumberAsFractionOrDecimal(options[0].value)}
            maxLabel={formatNumberAsFractionOrDecimal(options[options.length - 1].value)}
            currentLabel={formatNumberAsFractionOrDecimal(selectedOption.value)}
            max={options.length - 1}
            min={0}
            step={1}
            value={[activeIndex]}
            disabled={disabled}
            onValueChange={(v) => setShutterSpeedIndex(v[0] ?? 0)}
          />
          <Button
            disabled={disabled || shutterSpeedIdsWatch.includes(selectedOption.id)}
            size="sm"
            className="shrink-0"
            type="button"
            onClick={() => {
              const next = sortShutterSpeedIdsByValue(
                Array.from(new Set([...shutterSpeedIdsWatch, selectedOption.id]))
              );
              form.setValue('shutterSpeedIds', next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            }}
          >
            Ajouter
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {sortedShutterSpeedIdsWatch.map((id) => (
            <BadgeWithAction
              variant="brand"
              key={id}
              content={formatNumberAsFractionOrDecimal(valueById.get(id)!)}
              Icon={XCircle}
              iconColor="text-brand-600"
              action={
                !disabled && shutterSpeedIdsWatch.length > 1
                  ? () => {
                      form.setValue(
                        'shutterSpeedIds',
                        shutterSpeedIdsWatch.filter((currentId) => currentId !== id),
                        { shouldValidate: true, shouldDirty: true, shouldTouch: true }
                      );
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShutterSpeedsFormSection;
