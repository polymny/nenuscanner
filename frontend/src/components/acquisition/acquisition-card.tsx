import { Camera, Clapperboard, EllipsisVertical, Trash } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { Acquisition } from '@/types/acquisition.types';
import { acquisitionStatusBadges } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn, formatDateFr } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ScenarioSummaryStats from '@/components/scenario/scenario-summary-stats';

interface AcquisitionCardProps {
  acquisition: Acquisition;
  onClick: () => void;
  onDelete: () => void;
}

export default function AcquisitionCard({ acquisition, onClick, onDelete }: AcquisitionCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="flex cursor-pointer flex-col gap-4 rounded-lg border border-gray-300 bg-white p-3"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-gray-950">{acquisition.name}</div>
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
          <PopoverContent className="w-[150px]">
            <div className="flex flex-col gap-3">
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
          'bg-brand-100 relative flex h-[200px] w-full items-center justify-center rounded-md',
          acquisition.thumbnail ? 'bg-cover bg-center bg-no-repeat' : 'bg-gray-200'
        )}
        style={{
          backgroundImage: acquisition.thumbnail ? `url(${toAbsoluteImageUrl(acquisition.thumbnail)})` : undefined,
        }}
      >
        {!acquisition.thumbnail && (
          <div className="rounded-full border border-gray-200 bg-white p-4">
            <Camera className="text-brand-600 size-10" />
          </div>
        )}
        <div className="text-brand-950 absolute bottom-3 left-3 rounded-3xl bg-white p-2 text-sm font-medium">
          {formatDateFr(acquisition.createdAt)}
        </div>
      </div>
      <div
        className="flex items-center gap-3 divide-x divide-gray-200 rounded-md bg-transparent py-1 hover:bg-gray-100"
        onClick={(event) => {
          event.stopPropagation();
          navigate({ to: `/scenarios/${acquisition.scenario.id}` });
          return false;
        }}
      >
        <div className="inline-flex items-center gap-1 px-2">
          <div className="bg-brand-600 flex items-center justify-center rounded-full p-2">
            <Clapperboard className="size-3 text-white" />
          </div>
          <div className="wrap-break-words max-w-[300px] text-sm font-medium text-gray-700">
            {acquisition.scenario.name}
          </div>
        </div>
        <ScenarioSummaryStats scenario={acquisition.scenario} />
      </div>
    </div>
  );
}
