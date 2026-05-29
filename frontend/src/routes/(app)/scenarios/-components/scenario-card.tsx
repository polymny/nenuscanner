import { useNavigate } from '@tanstack/react-router';
import { Clapperboard, Copy, EllipsisVertical, Hourglass, Lightbulb, Moon, RotateCw, Sun, Trash } from 'lucide-react';
import type { Scenario } from '@/types/scenario.types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

import { formatDateFr, pluralize } from '@/lib/utils';

export interface ScenarioCardProps extends React.HTMLAttributes<HTMLDivElement> {
  scenario: Scenario;
  onDelete: () => void;
  onDuplicate: () => void;
}
export function ScenarioCard({ scenario, onDelete, onDuplicate }: ScenarioCardProps) {
  const navigate = useNavigate();

  const isCalibrated = scenario.calibrations.length > 0;
  const ledValues = scenario.leds.map((l) => l.value);
  const hasNoLed = ledValues.includes('NO_LED');
  const hasAllLeds = ledValues.includes('ALL_LEDS');
  const ledsCount = ledValues.length;
  const shutterSpeedsCount = scenario.shutterSpeeds.length;
  const rotationsCount = scenario.rotationsCount;

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
              <Badge className="self-start" variant={isCalibrated ? 'success' : 'error'}>
                {isCalibrated ? 'Étalonné' : 'Non étalonné'}
              </Badge>
              <Badge className="self-start" variant="light-gray">
                {scenario.acquisitions.length} {pluralize(scenario.acquisitions.length, 'acquisition')}
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

      <div className="ml-[50px] flex flex-wrap items-center divide-x divide-gray-200 text-gray-600">
        {hasNoLed && (
          <span className="inline-flex items-center px-2 first:pl-0 last:pr-0" title="Aucune LED">
            <Moon className="size-4 text-indigo-600" />
          </span>
        )}
        {hasAllLeds && (
          <span className="inline-flex items-center px-2 first:pl-0 last:pr-0" title="Toutes les LEDs">
            <Sun className="size-4 text-amber-500" />
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 px-2 first:pl-0 last:pr-0"
          title={`${ledsCount} ${pluralize(ledsCount, 'valeur')} de LED`}
        >
          <span className="text-xs font-semibold text-sky-700 tabular-nums">{ledsCount}</span>
          <Lightbulb className="size-4 text-sky-600" />
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 first:pl-0 last:pr-0"
          title={`${shutterSpeedsCount} ${pluralize(shutterSpeedsCount, 'vitesse')} d'obturation`}
        >
          <span className="text-xs font-semibold text-cyan-700 tabular-nums">{shutterSpeedsCount}</span>
          <Hourglass className="size-4 text-cyan-600" />
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 first:pl-0 last:pr-0"
          title={`${rotationsCount} ${pluralize(rotationsCount, 'rotation')}`}
        >
          <span className="text-xs font-semibold text-violet-700 tabular-nums">{rotationsCount}</span>
          <RotateCw className="size-4 text-violet-600" />
        </span>
      </div>
    </div>
  );
}
