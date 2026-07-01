import { useNavigate } from '@tanstack/react-router';
import { Camera, ChevronDown, Download, Ellipsis, Trash } from 'lucide-react';
import type { Acquisition } from '@/types/acquisition.types';
import { acquisitionStatusBadges } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';
import { useGetCompatibleScenarios, useGetScenarios } from '@/api/queries/scenario.queries';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn, formatDateFr, formatSizeGb, pluralize } from '@/lib/utils';
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
  const navigate = useNavigate();
  const { data: compatibleScenarios = [] } = useGetCompatibleScenarios(
    acquisition.scenario.id,
    acquisition.isCalibration
  );
  const { data: scenarios = [] } = useGetScenarios({ enabled: acquisition.isCalibration });
  const compatibilityById = new Map(compatibleScenarios.map((item) => [item.id, item]));
  const otherScenarios = scenarios
    .filter((scenario) => {
      if (scenario.id === acquisition.scenario.id) return false;

      const compatibility = compatibilityById.get(scenario.id);
      if (!compatibility) return false;

      return compatibility.sameLedPowerValues || compatibility.sameShutterSpeeds || compatibility.sameRotationsCount;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasCompatibleScenarios = acquisition.isCalibration && otherScenarios.length > 0;

  return (
    <div
      className={cn(
        'hover:bg-brand-50 flex cursor-pointer flex-col gap-1 rounded-lg border border-transparent p-3 transition-colors',
        dimmed && 'opacity-75 saturate-[0.9]',
        selected && 'border-brand-600 bg-brand-50'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-8 px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {onSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(checked === true)}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          <div
            title={acquisition.name}
            className={cn('flex-1 truncate text-lg font-semibold', dimmed ? 'text-gray-500' : 'text-gray-950')}
          >
            {acquisition.name}
          </div>
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
              <Ellipsis className="size-6" color="#64748B" />
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
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Badge variant={acquisitionStatusBadges[acquisition.status].badgeVariant.variant}>
            {acquisitionStatusBadges[acquisition.status].label}
          </Badge>
          {acquisition.isCalibration ? (
            <Badge variant="light-gray">
              {acquisition.acquisitions?.length ?? 0} {pluralize(acquisition.acquisitions?.length ?? 0, 'acquisition')}
            </Badge>
          ) : (
            acquisition.calibrationId !== null && (
              <Badge
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  void navigate({ to: `/acquisitions/${acquisition.calibrationId}` });
                }}
                variant="warning"
              >
                Étalonnée
              </Badge>
            )
          )}
          <span className="flex items-center gap-1 rounded-lg bg-white p-1 text-xs" title="Position des bras">
            <span>{acquisition.armsPosition.emojiLeft}</span>
            <span>{acquisition.armsPosition.emojiRight}</span>
          </span>
        </div>
        <div
          className={cn(
            'absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs',
            dimmed ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          <span>{formatDateFr(acquisition.createdAt)}</span>
          {acquisition.status !== 'PENDING' && (
            <>
              <span aria-hidden className="font-bold">
                ·
              </span>
              <span>{formatSizeGb(acquisition.sizeBytes)}</span>
              <span aria-hidden className="font-bold">
                ·
              </span>
              <span className="flex items-center gap-0.5">
                {acquisition.photosCount}
                <Camera className="size-3" />
              </span>
            </>
          )}
        </div>
      </div>
      {hasCompatibleScenarios ? (
        <Popover>
          <PopoverAnchor asChild>
            <div className="flex items-center">
              <ScenarioSummaryRow className="flex-1" scenario={acquisition.scenario} />
              <PopoverTrigger asChild>
                <Button
                  className="h-[24px] shrink-0 cursor-pointer rounded-md text-gray-600 hover:bg-gray-200 data-[state=open]:bg-gray-200 data-[state=open]:text-gray-950 [&_svg]:transition-transform data-[state=open]:[&_svg]:rotate-180"
                  onClick={(event) => {
                    event.stopPropagation();
                    return false;
                  }}
                  variant="link"
                >
                  <ChevronDown className="size-[18px]" />
                </Button>
              </PopoverTrigger>
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="end"
            className="flex w-(--radix-popper-anchor-width) flex-col gap-2 border-gray-200 bg-gray-50 p-2"
            onClick={(event) => event.stopPropagation()}
            side="bottom"
            sideOffset={4}
          >
            <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Autres scénarios étalonnés
            </div>
            <div className="flex flex-col gap-2">
              {otherScenarios.map((scenario) => (
                <ScenarioSummaryRow
                  className="cursor-pointer"
                  compatibility={compatibilityById.get(scenario.id)}
                  key={scenario.id}
                  scenario={scenario}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <ScenarioSummaryRow scenario={acquisition.scenario} />
      )}
    </div>
  );
}
