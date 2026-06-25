import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useScenarioInspectMode, useScenarioInspectModeTarget } from './scenario-inspect-mode-context';
import InspectModeToggle from './inspect-mode-toggle';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { FormLabel } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
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
  const prevIsInspectMode = useRef(isInspectMode);

  const referenceIndex = Math.max(
    0,
    options.findIndex((option) => option.value === SHUTTER_SPEED_REFERENCE)
  );
  const [inspectIndex, setInspectIndex] = useState(referenceIndex);

  const form = useFormContext<UpsertScenarioPayload>();
  const shutterSpeedIdsWatch = useWatch({
    control: form.control,
    name: 'shutterSpeedIds',
  });

  const valueById = useMemo(() => new Map(options.map((option) => [option.id, option.value])), [options]);
  const sortShutterSpeedIdsByValue = (ids: Array<number>) =>
    [...ids].filter((id) => valueById.has(id)).sort((a, b) => (valueById.get(a) ?? 0) - (valueById.get(b) ?? 0));

  useEffect(() => {
    if (isInspectMode && !prevIsInspectMode.current) {
      setInspectIndex(referenceIndex);
      setShutterSpeedPreviewValue(options[referenceIndex].value);
    }
    prevIsInspectMode.current = isInspectMode;
  }, [isInspectMode, options, referenceIndex, setShutterSpeedPreviewValue]);

  const toggleShutterSpeed = (id: number) => {
    if (disabled) return;

    if (shutterSpeedIdsWatch.includes(id)) {
      if (shutterSpeedIdsWatch.length <= 1) return;
      form.setValue(
        'shutterSpeedIds',
        shutterSpeedIdsWatch.filter((currentId) => currentId !== id),
        { shouldValidate: true, shouldDirty: true, shouldTouch: true }
      );
      return;
    }

    form.setValue('shutterSpeedIds', sortShutterSpeedIdsByValue([...shutterSpeedIdsWatch, id]), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

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
        <div className="flex items-center gap-4">
          {isInspectMode && (
            <Slider
              className="w-[200px]"
              rangeBgColor="bg-warning-500"
              max={options.length - 1}
              min={0}
              step={1}
              value={[inspectIndex]}
              onValueChange={(v) => setInspectIndex(v[0] ?? referenceIndex)}
              onValueCommit={(v) => {
                const option = options[v[0] ?? referenceIndex];
                setShutterSpeedPreviewValue(option.value);
              }}
            />
          )}
          <InspectModeToggle active={isInspectMode} onToggle={toggleInspectMode} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <FormLabel>Veuillez sélectionner au moins un temps de pose</FormLabel>
        <div
          className="flex overflow-hidden rounded-xl border border-gray-200"
          role="group"
          aria-label="Temps de pose disponibles"
        >
          {options.map((option, index) => {
            const isSelected = shutterSpeedIdsWatch.includes(option.id);
            const isInspectPreview = isInspectMode && inspectIndex === index;

            return (
              <button
                key={option.id}
                aria-label={formatNumberAsFractionOrDecimal(option.value)}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-1 items-center justify-center border-r border-gray-200 px-2 py-3 text-xs font-medium last:border-r-0',
                  'focus-visible:ring-brand-600 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected && isInspectPreview && 'bg-[#8d5893] text-white',
                  !isSelected && isInspectPreview && 'bg-warning-200',
                  isInspectPreview &&
                    'ring-warning-600 ring-5 ring-inset first:rounded-l-xl last:rounded-r-xl disabled:opacity-100',
                  !isInspectPreview && isSelected && 'bg-brand-600 text-white',
                  !isInspectPreview && !isSelected && 'bg-white text-gray-600 hover:bg-gray-100'
                )}
                disabled={disabled}
                type="button"
                onClick={() => toggleShutterSpeed(option.id)}
              >
                {formatNumberAsFractionOrDecimal(option.value)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShutterSpeedsFormSection;
