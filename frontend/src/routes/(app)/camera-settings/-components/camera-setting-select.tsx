import { useId } from 'react';
import type { CameraSettingName } from '@/types/camera.types';
import type { UpdateCameraSettingPayload } from '@/schemas/camera.schemas';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findMatchingSettingValue, formatCameraSettingOption } from '@/lib/camera-settings-utils';

interface CameraSettingSelectProps {
  label: string;
  setting: CameraSettingName;
  values: Array<number>;
  currentValue: number;
  disabled?: boolean;
  onValueChange: (payload: UpdateCameraSettingPayload) => void;
}

const CameraSettingSelect = ({
  label,
  setting,
  values,
  currentValue,
  disabled,
  onValueChange,
}: CameraSettingSelectProps) => {
  const selectId = useId();
  const isDisabled = disabled || values.length === 0;
  const selectedValue = findMatchingSettingValue(values, currentValue);

  return (
    <div className="flex w-full flex-col gap-3">
      <Label className="text-subtle font-normal text-gray-500" htmlFor={selectId}>
        {label}
      </Label>
      <Select
        disabled={isDisabled}
        onValueChange={(value) => {
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) return;
          onValueChange({ setting, value: numericValue });
        }}
        value={selectedValue !== undefined ? String(selectedValue) : undefined}
      >
        <SelectTrigger className="w-full" id={selectId}>
          <SelectValue placeholder={values.length === 0 ? 'Aucune valeur disponible' : 'Sélectionner une valeur'} />
        </SelectTrigger>
        <SelectContent>
          {values.map((value) => (
            <SelectItem key={value} value={String(value)}>
              {formatCameraSettingOption(setting, value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CameraSettingSelect;
