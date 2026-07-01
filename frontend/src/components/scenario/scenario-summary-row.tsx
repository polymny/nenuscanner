import { Clapperboard } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { ScenarioCompatibility, ScenarioSummary } from '@/types/scenario.types';
import ScenarioSummaryStats from '@/components/scenario/scenario-summary-stats';
import ScenarioCompatibilityIndicators from '@/components/scenario/scenario-compatibility-indicators';
import { cn } from '@/lib/utils';

interface ScenarioSummaryRowProps {
  scenario: ScenarioSummary;
  compatibility?: Omit<ScenarioCompatibility, 'id'>;
  className?: string;
  interactive?: boolean;
}

export default function ScenarioSummaryRow({
  scenario,
  compatibility,
  className,
  interactive = true,
}: ScenarioSummaryRowProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex items-center gap-3 divide-x divide-gray-200',
        interactive && 'rounded-md bg-transparent py-1 hover:bg-gray-200',
        className
      )}
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              navigate({ to: `/scenarios/${scenario.id}` });
              return false;
            }
          : undefined
      }
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden px-2">
        <div className="bg-brand-600 flex rounded-full p-1.5">
          <Clapperboard className="size-3 text-white" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          {compatibility && <ScenarioCompatibilityIndicators compatibility={compatibility} />}
          <div className="truncate text-sm font-medium text-gray-700" title={scenario.name}>
            {scenario.name}
          </div>
        </div>
      </div>
      <ScenarioSummaryStats className="flex-1" scenario={scenario} />
    </div>
  );
}
