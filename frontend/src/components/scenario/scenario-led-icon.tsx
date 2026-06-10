import { Lightbulb, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LedValue } from '@/types/led.types';
import { cn } from '@/lib/utils';

export const getLedIconConfig = (
  ledValue: LedValue | string | null | undefined
): { Icon: LucideIcon; className: string } => {
  if (ledValue === 'NO_LED') return { Icon: Moon, className: 'text-indigo-600' };
  if (ledValue === 'ALL_LEDS') return { Icon: Sun, className: 'text-amber-500' };
  return { Icon: Lightbulb, className: 'text-sky-600' };
};

interface ScenarioLedIconProps {
  ledValue: LedValue | null;
}

export function ScenarioLedIcon({ ledValue }: ScenarioLedIconProps) {
  const { Icon, className: colorClass } = getLedIconConfig(ledValue);
  return <Icon className={cn('size-4 shrink-0', colorClass)} />;
}
