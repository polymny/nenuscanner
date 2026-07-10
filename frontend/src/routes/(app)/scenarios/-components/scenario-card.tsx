import { useNavigate } from '@tanstack/react-router';
import { Clapperboard, Copy, EllipsisVertical, RulerDimensionLine, Trash } from 'lucide-react';
import type { Scenario } from '@/types/scenario.types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

import ScenarioSummaryStats from '@/components/scenario/scenario-summary-stats';
import { formatDateFr, pluralize } from '@/lib/utils';

export interface ScenarioCardProps extends React.HTMLAttributes<HTMLDivElement> {
  scenario: Scenario;
  onDelete: () => void;
  onDuplicate: () => void;
  onCalibrate: () => void;
}
export function ScenarioCard({ scenario, onDelete, onDuplicate, onCalibrate }: ScenarioCardProps) {
  const navigate = useNavigate();

  const acquisitionsCount = scenario.acquisitions.length + scenario.calibrations.length;

  return (
    <div
      className="flex min-h-[90px] flex-1 cursor-pointer flex-col items-start gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      onClick={() => navigate({ to: `/scenarios/${scenario.id}` })}
    >
      <div className="flex h-full w-full items-center gap-3">
        <div className="flex flex-1 flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 flex items-center justify-center rounded-full p-3">
              <Clapperboard className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="wrap-break-words max-w-[300px] text-sm font-semibold text-gray-700">
                  {scenario.name}
                </div>
                <div className="text-subtle wrap-break-words max-w-[400px] text-gray-600">
                  {formatDateFr(scenario.updatedAt)}
                </div>
              </div>
              <Badge className="self-start" variant="light-gray">
                {acquisitionsCount} {pluralize(acquisitionsCount, 'acquisition')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex h-full items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  return false;
                }}
                variant="link"
              >
                <EllipsisVertical color="#64748B" size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[150px]">
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full justify-start text-sm text-gray-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCalibrate();
                    return false;
                  }}
                  variant="link"
                >
                  <RulerDimensionLine className="text-gray-700" size={20} />
                  Étalonner
                </Button>
                <Button
                  className={`w-full justify-start text-sm text-gray-700`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDuplicate();
                    return false;
                  }}
                  variant="link"
                >
                  <Copy className="text-gray-700" size={20} />
                  Dupliquer
                </Button>
                <Button
                  className={`text-error-700 w-full justify-start text-sm`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                    return false;
                  }}
                  variant="link"
                >
                  <Trash className="text-error-700" size={20} />
                  Supprimer
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ScenarioSummaryStats className="ml-[50px]" scenario={scenario} iconsSize="size-4" />
    </div>
  );
}
