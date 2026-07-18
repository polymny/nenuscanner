import { Hourglass, RotateCw } from 'lucide-react';
import type { ScenarioSummary } from '@/types/scenario.types';
import { ScenarioLedIcon } from '@/components/scenario/scenario-led-icon';
import { cn, pluralize } from '@/lib/utils';

interface ScenarioSummaryStatsProps {
  scenario: Pick<ScenarioSummary, 'leds' | 'shutterSpeedIds' | 'posesCount'>;
  className?: string;
  iconsSize?: string;
}

export default function ScenarioSummaryStats({ scenario, className, iconsSize = 'size-3' }: ScenarioSummaryStatsProps) {
  const ledValues = scenario.leds.map((l) => l.value);
  const hasNoLed = ledValues.includes('NO_LED');
  const hasAllLeds = ledValues.includes('ALL_LEDS');
  const ledsCount = ledValues.filter((l) => l !== 'NO_LED' && l !== 'ALL_LEDS').length;
  const shutterSpeedsCount = scenario.shutterSpeedIds.length;
  const posesCount = scenario.posesCount;

  return (
    <div className={cn('flex flex-wrap items-center gap-y-2 divide-x divide-gray-200 text-gray-600', className)}>
      <span className="inline-flex items-center px-1" title="Aucune LED">
        <ScenarioLedIcon ledValue="NO_LED" className={cn(hasNoLed ? '' : 'text-gray-400', iconsSize)} />
      </span>
      <span className="inline-flex items-center px-1" title="Toutes les LEDs">
        <ScenarioLedIcon ledValue="ALL_LEDS" className={cn(hasAllLeds ? '' : 'text-gray-400', iconsSize)} />
      </span>
      <span
        className="inline-flex items-center gap-1 px-1"
        title={`${ledsCount} ${pluralize(ledsCount, 'valeur')} de LED`}
      >
        <span className="text-xs font-semibold text-sky-700 tabular-nums">{ledsCount}</span>
        <ScenarioLedIcon ledValue="1" className={iconsSize} />
      </span>
      <span className="inline-flex items-center gap-1 px-1" title={`${shutterSpeedsCount} temps de pose`}>
        <span className="text-xs font-semibold text-cyan-700 tabular-nums">{shutterSpeedsCount}</span>
        <Hourglass className={cn('text-cyan-600', iconsSize)} />
      </span>
      <span className="inline-flex items-center gap-1 px-1" title={`${posesCount} ${pluralize(posesCount, 'pose')}`}>
        <span className="text-xs font-semibold text-violet-700 tabular-nums">{posesCount}</span>
        <RotateCw className={cn('text-violet-600', iconsSize)} />
      </span>
    </div>
  );
}
