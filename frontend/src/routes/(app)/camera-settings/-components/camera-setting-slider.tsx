import { useEffect, useId, useState } from 'react';
import type { CameraSettingName } from '@/types/camera.types';
import type { UpdateCameraSettingPayload } from '@/schemas/camera.schemas';
import { Label } from '@/components/ui/label';
import { SliderWithLabels } from '@/components/ui/slider-with-labels';
import { findMatchingSettingValue, formatCameraSettingOption } from '@/lib/camera-settings-utils';

interface CameraSettingSliderProps {
  label: string;
  setting: CameraSettingName;
  values: Array<number>;
  currentValue: number;
  disabled?: boolean;
  onValueChange: (payload: UpdateCameraSettingPayload) => void;
}

const findValueIndex = (values: Array<number>, current: number): number => {
  const matched = findMatchingSettingValue(values, current);
  if (matched === undefined) return 0;
  const index = values.indexOf(matched);
  return index >= 0 ? index : 0;
};

const CameraSettingSlider = ({
  label,
  setting,
  values,
  currentValue,
  disabled,
  onValueChange,
}: CameraSettingSliderProps) => {
  const sliderId = useId();
  const isDisabled = disabled || values.length === 0;
  const [activeIndex, setActiveIndex] = useState(() => findValueIndex(values, currentValue));

  useEffect(() => {
    setActiveIndex(findValueIndex(values, currentValue));
  }, [currentValue, values]);

  const selectedValue = values[activeIndex];
  const hasValues = values.length > 0;

  return (
    <div className="flex w-full flex-col gap-4">
      <Label className="text-subtle font-normal text-gray-500" htmlFor={sliderId}>
        {label}
      </Label>
      {hasValues ? (
        <SliderWithLabels
          wrapperClassName="w-full"
          id={sliderId}
          min={0}
          max={values.length - 1}
          step={1}
          value={[activeIndex]}
          disabled={isDisabled}
          minLabel={formatCameraSettingOption(setting, values[0])}
          maxLabel={formatCameraSettingOption(setting, values[values.length - 1])}
          currentLabel={formatCameraSettingOption(setting, selectedValue)}
          onValueChange={(value) => setActiveIndex(value[0] ?? 0)}
          onValueCommit={(value) => {
            const numericValue = values[value[0] ?? 0];
            const matchedCurrent = findMatchingSettingValue(values, currentValue);
            if (matchedCurrent !== undefined && matchedCurrent === numericValue) return;

            onValueChange({ setting, value: numericValue });
          }}
        />
      ) : (
        <p className="text-sm text-gray-500" id={sliderId}>
          Aucune valeur disponible
        </p>
      )}
    </div>
  );
};

export default CameraSettingSlider;
