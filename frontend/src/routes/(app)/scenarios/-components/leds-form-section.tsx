import { useMemo, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { FormLabel } from '@/components/ui/form';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { LED_VALUES, getLedValueLabel } from '@/types/led.types';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const LedsFormSection = () => {
  const form = useFormContext<UpsertScenarioPayload>();
  const ledsWatch = useWatch({
    control: form.control,
    name: 'leds',
  });
  const { append: appendLed, remove: removeLed } = useFieldArray({ control: form.control, name: 'leds' });

  const selectedByLedValue = useMemo(() => {
    const map = new Map<string, { index: number; power: number }>();
    for (let i = 0; i < ledsWatch.length; i += 1) {
      const ledItem = ledsWatch[i];
      map.set(ledItem.value, { index: i, power: ledItem.power });
    }
    return map;
  }, [ledsWatch]);

  const [powerByLedValue, setPowerByLedValue] = useState<Record<string, number>>({});

  return (
    <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
      <h3 className="text-brand-600">Gestion des LEDs</h3>
      <div className="flex flex-col gap-3">
        <FormLabel>Veuillez sélectionner au moins une LED à utiliser</FormLabel>
        <div className="grid grid-cols-3 gap-6">
          {LED_VALUES.map((ledValue) => {
            const selected = selectedByLedValue.get(ledValue);
            const isSelected = selected !== undefined;
            const isNoLed = ledValue === 'NO_LED';

            const fallbackPower = 0;
            const currentPower = powerByLedValue[ledValue] ?? (isSelected ? selected.power : fallbackPower);

            return (
              <div
                className={cn(
                  'flex flex-col gap-3 rounded-lg border border-gray-200 p-4',
                  isSelected ? 'border-brand-600 bg-brand-50' : 'border-gray-200'
                )}
                key={ledValue}
              >
                <div className="flex items-center gap-4">
                  <Switch
                    className="data-[state=checked]:bg-success-500"
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        appendLed({ value: ledValue, power: isNoLed ? 0 : currentPower });
                        form.trigger('leds');
                        return;
                      }
                      if (selected) {
                        removeLed(selected.index);
                        form.trigger('leds');
                      }
                    }}
                  />
                  <FormLabel className="text-lg!! font-medium!">{getLedValueLabel(ledValue)}</FormLabel>
                </div>

                {isNoLed ? null : (
                  <SliderWithLabels
                    rangeBgColor={isSelected ? 'bg-brand-600' : 'bg-brand-600/50'}
                    wrapperClassName="w-4/5"
                    minLabel="0.00"
                    maxLabel="1.00"
                    currentLabel={Number(currentPower).toFixed(2)}
                    max={1}
                    min={0.0}
                    step={0.1}
                    value={[currentPower]}
                    onValueChange={(v) => {
                      const nextPower = v[0] ?? 0;
                      setPowerByLedValue((prev) => ({ ...prev, [ledValue]: nextPower }));

                      if (selected) {
                        form.setValue(`leds.${selected.index}.power`, nextPower, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LedsFormSection;
