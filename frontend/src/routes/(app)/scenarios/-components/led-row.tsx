import { memo, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import type { LedValue } from '@/types/led.types';
import type { LedPowerValueOption } from '@/types/led-power-value.types';
import { FormLabel } from '@/components/ui/form';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getLedValueLabel } from '@/types/led.types';

export interface LedRowProps {
  ledValue: LedValue;
  powerOptions: Array<LedPowerValueOption>;
  disabled?: boolean;
  isSelected: boolean;
  powerId: number;
  fieldIndex?: number;
  onToggle: (checked: boolean, powerId: number) => void;
}

const LedRow = ({
  ledValue,
  powerOptions,
  disabled = false,
  isSelected,
  powerId,
  fieldIndex,
  onToggle,
}: LedRowProps) => {
  const form = useFormContext<UpsertScenarioPayload>();
  const isNoLed = ledValue === 'NO_LED';

  const [powerIndex, setPowerIndex] = useState<number | null>(null);
  const activeIndex =
    powerIndex ??
    Math.max(
      0,
      powerOptions.findIndex((option) => option.id === powerId)
    );
  const selectedOption = powerOptions[activeIndex] ?? powerOptions[0];

  useEffect(() => {
    if (isSelected) setPowerIndex(powerOptions.findIndex((option) => option.id === powerId));
  }, [isSelected, powerId, powerOptions]);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-gray-200 p-4',
        isSelected ? 'border-brand-600 bg-brand-50' : 'border-gray-200'
      )}
    >
      <div className="flex items-center gap-4">
        <Switch
          className="data-[state=checked]:bg-success-500"
          checked={isSelected}
          disabled={disabled}
          onCheckedChange={(checked) => onToggle(checked, selectedOption.id)}
        />
        <FormLabel className="text-lg!! font-medium!">{getLedValueLabel(ledValue)}</FormLabel>
      </div>

      {isNoLed ? null : (
        <SliderWithLabels
          rangeBgColor={isSelected ? 'bg-brand-600' : 'bg-brand-600/50'}
          wrapperClassName="w-4/5"
          minLabel={Number(powerOptions[0].value).toFixed(2)}
          maxLabel={Number(powerOptions[powerOptions.length - 1].value).toFixed(2)}
          currentLabel={Number(selectedOption.value).toFixed(2)}
          max={powerOptions.length - 1}
          min={0}
          step={1}
          value={[activeIndex]}
          disabled={disabled}
          onValueChange={(v) => setPowerIndex(v[0] ?? 0)}
          onValueCommit={(v) => {
            const nextOption = powerOptions[v[0] ?? 0];
            if (fieldIndex === undefined) return;
            form.setValue(`leds.${fieldIndex}.powerId`, nextOption.id, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      )}
    </div>
  );
};

export default memo(
  LedRow,
  (prev, next) =>
    prev.ledValue === next.ledValue &&
    prev.powerOptions === next.powerOptions &&
    prev.disabled === next.disabled &&
    prev.isSelected === next.isSelected &&
    prev.powerId === next.powerId &&
    prev.fieldIndex === next.fieldIndex
);
