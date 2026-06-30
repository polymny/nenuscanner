import { useState } from 'react';
import { Camera, ChevronDown, ChevronRight, Download, EllipsisVertical, Trash } from 'lucide-react';
import type { Acquisition } from '@/types/acquisition.types';
import { acquisitionStatusBadges } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';
import { useGetCompatibleScenarios, useGetScenarios } from '@/api/queries/scenario.queries';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn, formatDateFr } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import ScenarioSummaryRow from '@/components/scenario/scenario-summary-row';

interface AcquisitionCardProps {
  acquisition: Acquisition;
  onClick: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  dimmed?: boolean;
}

export default function AcquisitionCard({
  acquisition,
  onClick,
  onDelete,
  onDownload,
  onSelect,
  selected = false,
  dimmed = false,
}: AcquisitionCardProps) {
  const [showCompatibleScenarios, setShowCompatibleScenarios] = useState(false);
  const { data: compatibleScenarios = [] } = useGetCompatibleScenarios(
    acquisition.scenario.id,
    acquisition.isCalibration
  );
  const { data: scenarios = [] } = useGetScenarios({ enabled: acquisition.isCalibration });
  const compatibilityById = new Map(compatibleScenarios.map((item) => [item.id, item]));
  const otherScenarios = scenarios
    .filter((scenario) => scenario.id !== acquisition.scenario.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasCompatibleScenarios = acquisition.isCalibration && otherScenarios.length > 0;

  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col gap-4 rounded-lg border border-gray-300 p-3 transition-colors',
        dimmed ? 'bg-gray-100 opacity-75 saturate-[0.9]' : 'bg-white shadow-sm',
        selected && !dimmed && 'border-brand-600 bg-brand-50 shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(checked === true)}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          <div className={cn('text-lg font-semibold', dimmed ? 'text-gray-500' : 'text-gray-950')}>
            {acquisition.name}
          </div>
          <span className="flex items-center gap-1 text-lg" title="Position des bras">
            <span>{acquisition.armsPosition.emojiLeft}</span>
            <span>{acquisition.armsPosition.emojiRight}</span>
          </span>
          <Badge variant={acquisitionStatusBadges[acquisition.status].badgeVariant.variant}>
            {acquisitionStatusBadges[acquisition.status].label}
          </Badge>
        </div>
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
          <PopoverContent className="w-[180px]">
            <div className="flex flex-col gap-3">
              {onDownload && (
                <Button
                  className="w-full justify-start text-sm text-gray-700"
                  onClick={(event) => {
                    onDownload();
                    event.stopPropagation();
                    return false;
                  }}
                  variant="link"
                >
                  <Download size={20} />
                  Télécharger
                </Button>
              )}
              <Button
                className={`text-error-700 w-full justify-start text-sm`}
                onClick={(event) => {
                  onDelete();
                  event.stopPropagation();
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
      <div
        className={cn(
          'relative flex h-[200px] w-full items-center justify-center rounded-md',
          dimmed ? 'bg-gray-200' : 'bg-brand-100',
          acquisition.thumbnail ? 'bg-cover bg-center bg-no-repeat' : !dimmed && 'bg-gray-200'
        )}
        style={{
          backgroundImage: acquisition.thumbnail ? `url(${toAbsoluteImageUrl(acquisition.thumbnail)})` : undefined,
        }}
      >
        {!acquisition.thumbnail && (
          <div className="rounded-full border border-gray-200 bg-white p-4">
            <Camera className={cn('size-10', dimmed ? 'text-gray-400' : 'text-brand-600')} />
          </div>
        )}
        <div
          className={cn(
            'absolute bottom-3 left-3 rounded-3xl bg-white p-2 text-sm font-medium',
            dimmed ? 'text-gray-500' : 'text-brand-950'
          )}
        >
          {formatDateFr(acquisition.createdAt)}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <ScenarioSummaryRow className="flex-1" scenario={acquisition.scenario} />
          {hasCompatibleScenarios && (
            <Button
              className="shrink-0 px-2 text-gray-600"
              onClick={(event) => {
                event.stopPropagation();
                setShowCompatibleScenarios((current) => !current);
                return false;
              }}
              variant="link"
            >
              {showCompatibleScenarios ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </Button>
          )}
        </div>
        {hasCompatibleScenarios && showCompatibleScenarios && (
          <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
            <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Autres scénarios étalonnés
            </div>
            <div className="flex flex-col gap-2">
              {otherScenarios.map((scenario) => {
                const compatibility = compatibilityById.get(scenario.id);
                if (!compatibility) return null;

                return <ScenarioSummaryRow compatibility={compatibility} key={scenario.id} scenario={scenario} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
