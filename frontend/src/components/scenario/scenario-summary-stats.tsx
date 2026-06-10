import { Hourglass, Lightbulb, Moon, RotateCw, Sun } from 'lucide-react';
import type { ScenarioSummary } from '@/types/scenario.types';
import { cn, pluralize } from '@/lib/utils';

interface ScenarioSummaryStatsProps {
  scenario: Pick<ScenarioSummary, 'leds' | 'shutterSpeedIds' | 'rotationsCount'>;
  className?: string;
}

export default function ScenarioSummaryStats({ scenario, className }: ScenarioSummaryStatsProps) {
  const ledValues = scenario.leds.map((l) => l.value);
  const hasNoLed = ledValues.includes('NO_LED');
  const hasAllLeds = ledValues.includes('ALL_LEDS');
  const ledsCount = ledValues.length;
  const shutterSpeedsCount = scenario.shutterSpeedIds.length;
  const rotationsCount = scenario.rotationsCount;

  return (
    <div className={cn('flex flex-wrap items-center gap-y-2 divide-x divide-gray-200 text-gray-600', className)}>
      {hasNoLed && (
        <span className="inline-flex items-center px-2" title="Aucune LED">
          <Moon className="size-4 text-indigo-600" />
        </span>
      )}
      {hasAllLeds && (
        <span className="inline-flex items-center px-2" title="Toutes les LEDs">
          <Sun className="size-4 text-amber-500" />
        </span>
      )}
      <span
        className="inline-flex items-center gap-1 px-2"
        title={`${ledsCount} ${pluralize(ledsCount, 'valeur')} de LED`}
      >
        <span className="text-xs font-semibold text-sky-700 tabular-nums">{ledsCount}</span>
        <Lightbulb className="size-4 text-sky-600" />
      </span>
      <span
        className="inline-flex items-center gap-1 px-2"
        title={`${shutterSpeedsCount} ${pluralize(shutterSpeedsCount, 'vitesse')} d'obturation`}
      >
        <span className="text-xs font-semibold text-cyan-700 tabular-nums">{shutterSpeedsCount}</span>
        <Hourglass className="size-4 text-cyan-600" />
      </span>
      <span
        className="inline-flex items-center gap-1 px-2"
        title={`${rotationsCount} ${pluralize(rotationsCount, 'rotation')}`}
      >
        <span className="text-xs font-semibold text-violet-700 tabular-nums">{rotationsCount}</span>
        <RotateCw className="size-4 text-violet-600" />
      </span>
    </div>
  );
}
