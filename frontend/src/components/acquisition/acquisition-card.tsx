import { useNavigate } from '@tanstack/react-router';
import { Camera, ChevronDown, Download, Trash } from 'lucide-react';
import type { Acquisition } from '@/types/acquisition.types';
import type { CardMenuItem } from '@/components/selectable-card';
import { acquisitionStatusBadges } from '@/types/acquisition.types';
import { useGetCompatibleScenarios, useGetScenarios } from '@/api/queries/scenario.queries';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn, formatDateFr, formatSizeGb, pluralize } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ScenarioSummaryRow from '@/components/scenario/scenario-summary-row';
import SelectableCard, { CardThumbnail } from '@/components/selectable-card';

interface AcquisitionCardProps {
  acquisition: Acquisition;
  onClick: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  /** While something is selected, clicking a card toggles it instead of opening it. */
  selectionMode?: boolean;
  dimmed?: boolean;
}

export default function AcquisitionCard({
  acquisition,
  onClick,
  onDelete,
  onDownload,
  onSelect,
  selected = false,
  selectionMode = false,
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

      return compatibility.sameLedPowerValues || compatibility.sameShutterSpeeds || compatibility.samePosesCount;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasCompatibleScenarios = acquisition.isCalibration && otherScenarios.length > 0;

  const menuItems: Array<CardMenuItem> = [
    ...(onDownload ? [{ label: 'Télécharger', icon: Download, onClick: onDownload }] : []),
    { label: 'Supprimer', icon: Trash, onClick: onDelete, destructive: true },
  ];

  return (
    <SelectableCard
      dimmed={dimmed}
      menuItems={menuItems}
      name={acquisition.name}
      onOpen={onClick}
      onSelect={onSelect}
      selected={selected}
      selectionMode={selectionMode}
    >
      <CardThumbnail dimmed={dimmed} thumbnail={acquisition.thumbnail}>
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
          <span className="flex items-center gap-1 rounded-lg bg-white p-1 text-xs" title="Rig">
            <span>{acquisition.rigConfiguration.emojiLeft}</span>
            <span>{acquisition.rigConfiguration.emojiRight}</span>
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
                {acquisition.imagesCount}
                <Camera className="size-3" />
              </span>
            </>
          )}
        </div>
      </CardThumbnail>
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
    </SelectableCard>
  );
}
