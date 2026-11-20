import { ArrowRight, Camera, Ellipsis } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';
import { cn } from '@/lib/utils';

export interface CardMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

interface SelectableCardProps {
  name: string;
  onOpen: () => void;
  menuItems: Array<CardMenuItem>;
  children: ReactNode;
  /** Undefined when the item cannot be selected. */
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  /** While something is selected, clicking a card toggles it instead of opening it. */
  selectionMode?: boolean;
  dimmed?: boolean;
}

/** Card shell shared by acquisitions and artifacts: checkbox, name, menu and selection-aware click. */
export default function SelectableCard({
  name,
  onOpen,
  menuItems,
  children,
  onSelect,
  selected = false,
  selectionMode = false,
  dimmed = false,
}: SelectableCardProps) {
  const items: Array<CardMenuItem> = [{ label: 'Ouvrir', icon: ArrowRight, onClick: onOpen }, ...menuItems];

  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col gap-1 rounded-lg border border-transparent p-3 transition-colors',
        !selectionMode && 'hover:bg-brand-50',
        selectionMode && !selected && 'hover:border-brand-300 opacity-80 hover:border-dashed hover:opacity-100',
        selectionMode && !onSelect && 'cursor-default',
        dimmed && 'opacity-75 saturate-[0.9]',
        selected && 'border-brand-600 bg-brand-50'
      )}
      onClick={() => (selectionMode ? onSelect?.(!selected) : onOpen())}
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
            title={name}
            className={cn('flex-1 truncate text-lg font-semibold', dimmed ? 'text-gray-500' : 'text-gray-950')}
            onClick={
              onSelect
                ? (event) => {
                    // The name extends the tiny checkbox's hit area.
                    event.stopPropagation();
                    onSelect(!selected);
                  }
                : undefined
            }
          >
            {name}
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button onClick={(event) => event.stopPropagation()} variant="link">
              <Ellipsis className="size-6" color="#64748B" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px]">
            <div className="flex flex-col gap-3">
              {items.map(({ label, icon: Icon, onClick, destructive }) => (
                <Button
                  className={cn('w-full justify-start text-sm', destructive ? 'text-error-700' : 'text-gray-700')}
                  key={label}
                  onClick={(event) => {
                    // Menu content is portalled, but React still bubbles the click to the card.
                    event.stopPropagation();
                    onClick();
                  }}
                  variant="link"
                >
                  <Icon className={cn(destructive && 'text-error-700')} size={20} />
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  );
}

interface CardThumbnailProps {
  thumbnail: string | null;
  dimmed?: boolean;
  /** Shown when there is no thumbnail. */
  placeholderIcon?: LucideIcon;
  placeholder?: string;
  children?: ReactNode;
}

/** 200px image area with an icon placeholder; children are absolutely positioned overlays. */
export function CardThumbnail({
  thumbnail,
  dimmed = false,
  placeholderIcon: PlaceholderIcon = Camera,
  placeholder,
  children,
}: CardThumbnailProps) {
  return (
    <div
      className={cn(
        'relative flex h-[200px] w-full flex-col items-center justify-center gap-2 rounded-md',
        dimmed ? 'bg-gray-200' : 'bg-brand-100',
        thumbnail ? 'bg-cover bg-center bg-no-repeat' : !dimmed && 'bg-gray-200'
      )}
      style={{ backgroundImage: thumbnail ? `url(${toAbsoluteImageUrl(thumbnail)})` : undefined }}
    >
      {!thumbnail && (
        <>
          <div className="rounded-full border border-gray-200 bg-white p-4">
            <PlaceholderIcon className={cn('size-10', dimmed ? 'text-gray-400' : 'text-brand-600')} />
          </div>
          {placeholder && <span className="text-sm text-gray-500">{placeholder}</span>}
        </>
      )}
      {children}
    </div>
  );
}
