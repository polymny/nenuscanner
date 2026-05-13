import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CircleIcon } from 'lucide-react';
import { Label } from './label';
import type * as React from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

function FlatRadioGroupItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & { children: ReactNode }) {
  return (
    <Label
      className={cn(
        'hover:bg-accent/50 has-data-[state=checked]:border-brand-600 has-data-[state=checked]:bg-brand-50 flex cursor-pointer justify-between gap-3 rounded-lg border px-3 py-4 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
      <RadioGroupPrimitive.Item
        className="data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 size-4 rounded-full border border-gray-300 bg-white shadow-none *:data-[slot=radio-group-indicator]:[&>svg]:fill-white *:data-[slot=radio-group-indicator]:[&>svg]:stroke-white"
        data-slot="radio-group-item"
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          className="relative flex items-center justify-center"
          data-slot="radio-group-indicator"
        >
          <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    </Label>
  );
}

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} data-slot="radio-group" {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        (className =
          'data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 size-4 rounded-full border border-gray-300 bg-white shadow-none *:data-[slot=radio-group-indicator]:[&>svg]:fill-white *:data-[slot=radio-group-indicator]:[&>svg]:stroke-white'),
        className
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="relative flex items-center justify-center"
        data-slot="radio-group-indicator"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { FlatRadioGroupItem, RadioGroup, RadioGroupItem };
