import { Slider } from './slider';
import { cn } from '@/lib/utils';

interface SliderWithLabelsProps {
  minLabel: number | string;
  maxLabel: number | string;
  currentLabel: number | string;
  wrapperClassName?: string;
}

export function SliderWithLabels({
  wrapperClassName,
  minLabel,
  maxLabel,
  currentLabel,
  ...props
}: React.ComponentProps<typeof Slider> & SliderWithLabelsProps) {
  return (
    <div className={cn('flex flex-col gap-2', wrapperClassName)}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>{minLabel}</div>
        <div className="font-medium text-gray-700">{currentLabel}</div>
        <div>{maxLabel}</div>
      </div>
      <Slider {...props} />
    </div>
  );
}
