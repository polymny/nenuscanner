import { useMemo } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import LedRow from './led-row';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import { FormLabel } from '@/components/ui/form';
import { LED_VALUES } from '@/types/led.types';
import { useGetLedPowerValues } from '@/api/queries/led-power-value.queries';

interface LedsFormSectionProps {
  disabled?: boolean;
}

const LedsFormSection = ({ disabled = false }: LedsFormSectionProps) => {
  const { data: powerOptions = [], isLoading } = useGetLedPowerValues();
  const form = useFormContext<UpsertScenarioPayload>();
  const ledsWatch = useWatch({
    control: form.control,
    name: 'leds',
  });
  const { append: appendLed, remove: removeLed } = useFieldArray({ control: form.control, name: 'leds' });

  const selectedByLedValue = useMemo(() => {
    const map = new Map<string, { index: number; powerId: number }>();
    for (let i = 0; i < ledsWatch.length; i += 1) {
      const ledItem = ledsWatch[i];
      map.set(ledItem.value, { index: i, powerId: ledItem.powerId });
    }
    return map;
  }, [ledsWatch]);

  if (isLoading || powerOptions.length === 0) {
    return (
      <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-brand-600">Gestion des LEDs</h3>
        <p className="text-muted-foreground text-sm">Chargement des puissances LED disponibles…</p>
      </div>
    );
  }

  const minPowerId = powerOptions[0].id;

  return (
    <div className="flex w-3/4 flex-col gap-8 rounded-lg bg-white p-6 shadow-lg">
      <h3 className="text-brand-600">Gestion des LEDs</h3>
      <div className="flex flex-col gap-3">
        <FormLabel>Veuillez sélectionner au moins une LED à utiliser</FormLabel>
        <div className="grid grid-cols-3 gap-6">
          {LED_VALUES.map((ledValue) => {
            const selected = selectedByLedValue.get(ledValue);
            const isNoLed = ledValue === 'NO_LED';

            return (
              <LedRow
                key={ledValue}
                ledValue={ledValue}
                powerOptions={powerOptions}
                disabled={disabled}
                isSelected={selected !== undefined}
                powerId={selected?.powerId ?? minPowerId}
                fieldIndex={selected?.index}
                onToggle={(checked, currentPowerId) => {
                  if (checked) {
                    appendLed({ value: ledValue, powerId: isNoLed ? minPowerId : currentPowerId });
                    return;
                  }
                  if (selected) {
                    removeLed(selected.index);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LedsFormSection;
