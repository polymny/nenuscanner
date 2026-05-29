import { memo, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import type { LedValue } from '@/types/led.types';
import { FormLabel } from '@/components/ui/form';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getLedValueLabel } from '@/types/led.types';

export interface LedRowProps {
  ledValue: LedValue;
  disabled?: boolean;
  isSelected: boolean;
  power: number;
  fieldIndex?: number;
  onToggle: (checked: boolean, power: number) => void;
}

const LedRow = ({ ledValue, disabled = false, isSelected, power, fieldIndex, onToggle }: LedRowProps) => {
  const form = useFormContext<UpsertScenarioPayload>();
  const [localPower, setLocalPower] = useState(power);
  const isNoLed = ledValue === 'NO_LED';

  useEffect(() => {
    if (isSelected) {
      setLocalPower(power);
    }
  }, [isSelected, power]);

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
          onCheckedChange={(checked) => onToggle(checked, localPower)}
        />
        <FormLabel className="text-lg!! font-medium!">{getLedValueLabel(ledValue)}</FormLabel>
      </div>

      {isNoLed ? null : (
        <SliderWithLabels
          rangeBgColor={isSelected ? 'bg-brand-600' : 'bg-brand-600/50'}
          wrapperClassName="w-4/5"
          minLabel="0.00"
          maxLabel="1.00"
          currentLabel={Number(localPower).toFixed(2)}
          max={1}
          min={0.0}
          step={0.1}
          value={[localPower]}
          disabled={disabled}
          onValueChange={(v) => setLocalPower(v[0] ?? 0)}
          onValueCommit={(v) => {
            const nextPower = v[0] ?? 0;
            if (fieldIndex === undefined) return;
            form.setValue(`leds.${fieldIndex}.power`, nextPower, {
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
    prev.disabled === next.disabled &&
    prev.isSelected === next.isSelected &&
    prev.power === next.power &&
    prev.fieldIndex === next.fieldIndex
);
