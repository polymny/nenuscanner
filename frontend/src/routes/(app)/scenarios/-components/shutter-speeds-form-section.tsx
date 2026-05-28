import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { XCircle } from 'lucide-react';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SHUTTER_SPEED_REFERENCE_VALUE, SHUTTER_SPEED_VALUES } from '@/lib/shutter-speed-utils';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { BadgeWithAction } from '@/components/ui/badge-with-action';
import { formatNumberAsFractionOrDecimal } from '@/lib/utils';

interface ShutterSpeedsFormSectionProps {
  disabled?: boolean;
}

const ShutterSpeedsFormSection = ({ disabled = false }: ShutterSpeedsFormSectionProps) => {
  const [shutterSpeedIndex, setShutterSpeedIndex] = useState(
    SHUTTER_SPEED_VALUES.indexOf(SHUTTER_SPEED_REFERENCE_VALUE)
  );

  const selectedShutterSpeed = useMemo(() => SHUTTER_SPEED_VALUES[shutterSpeedIndex], [shutterSpeedIndex]);

  const form = useFormContext<UpsertScenarioPayload>();
  const shutterSpeedsWatch = useWatch({
    control: form.control,
    name: 'shutterSpeeds',
  });
  const sortedShutterSpeedsWatch = useMemo(() => [...shutterSpeedsWatch].sort(), [shutterSpeedsWatch]);

  return (
    <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
      <h3 className="text-brand-600">Gestion des temps de pose</h3>
      <div className="flex flex-col gap-3">
        <FormLabel>Veuillez sélectionner au moins un temps de pose</FormLabel>
        <div className="flex items-start gap-4">
          <SliderWithLabels
            wrapperClassName="flex-1"
            minLabel={formatNumberAsFractionOrDecimal(SHUTTER_SPEED_VALUES[0])}
            maxLabel={formatNumberAsFractionOrDecimal(SHUTTER_SPEED_VALUES[SHUTTER_SPEED_VALUES.length - 1])}
            currentLabel={formatNumberAsFractionOrDecimal(selectedShutterSpeed)}
            max={SHUTTER_SPEED_VALUES.length - 1}
            min={0}
            step={1}
            value={[shutterSpeedIndex]}
            disabled={disabled}
            onValueChange={(v) => setShutterSpeedIndex(v[0] ?? 0)}
          />
          <Button
            disabled={disabled || shutterSpeedsWatch.includes(selectedShutterSpeed)}
            size="sm"
            className="shrink-0"
            type="button"
            onClick={() => {
              const next = Array.from(new Set([...shutterSpeedsWatch, selectedShutterSpeed]));
              form.setValue('shutterSpeeds', next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            }}
          >
            Ajouter
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {sortedShutterSpeedsWatch.map((v) => (
            <BadgeWithAction
              variant="brand"
              key={v}
              content={formatNumberAsFractionOrDecimal(v)}
              Icon={XCircle}
              iconColor="text-brand-600"
              action={
                !disabled && shutterSpeedsWatch.length > 1
                  ? () => {
                      form.setValue(
                        'shutterSpeeds',
                        shutterSpeedsWatch.filter((s) => s !== v),
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
