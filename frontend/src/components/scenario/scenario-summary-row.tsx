import { Clapperboard } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { ScenarioSummary } from '@/types/scenario.types';
import ScenarioSummaryStats from '@/components/scenario/scenario-summary-stats';
import { cn } from '@/lib/utils';

interface ScenarioSummaryRowProps {
  scenario: ScenarioSummary;
  className?: string;
}

export default function ScenarioSummaryRow({ scenario, className }: ScenarioSummaryRowProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex items-center gap-3 divide-x divide-gray-200 rounded-md bg-transparent py-1 hover:bg-gray-100',
        className
      )}
      onClick={(event) => {
        event.stopPropagation();
        navigate({ to: `/scenarios/${scenario.id}` });
        return false;
      }}
    >
      <div className="inline-flex items-center gap-1 px-2">
        <div className="bg-brand-600 flex items-center justify-center rounded-full p-2">
          <Clapperboard className="size-3 text-white" />
        </div>
        <div className="wrap-break-words max-w-[300px] text-sm font-medium text-gray-700">{scenario.name}</div>
      </div>
      <ScenarioSummaryStats scenario={scenario} />
    </div>
  );
}
