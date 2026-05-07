import { useNavigate } from '@tanstack/react-router';
import { EllipsisVertical, Pencil, Trash } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import type { badgeVariants } from './ui/badge';
import type { VariantProps } from 'class-variance-authority';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ComponentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  additionalContent?: ReactNode;
  badge?: {
    content: string;
    variant: VariantProps<typeof badgeVariants>;
  };
  description?: string;
  dynamicIconPath?: string;
  iconBackgroundColor?: string;
  iconPath?: string;
  onClickPath?: string;
  onClickSearch?: Record<string, unknown>;
  shared?: boolean;
  tags?: Array<string>;
  onDelete?: () => void;
  onUpdate?: () => void;
}
export function ComponentCard({
  additionalContent,
  badge,
  className,
  description,
  dynamicIconPath,
  iconBackgroundColor = 'bg-brand-600',
  iconPath,
  name,
  onClickPath,
  onClickSearch,
  shared,
  tags,
  onDelete,
  onUpdate,
}: ComponentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClickPath) {
      void navigate({ search: onClickSearch, to: onClickPath });
    }
  };

  return (
    <div
      className={cn(
        'relative flex min-h-[90px] flex-1 flex-col items-start gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      <div className="flex h-full w-full items-center gap-3">
        <div
          className={cn('flex flex-1 flex-col items-start gap-3', onClickPath ? 'cursor-pointer' : '')}
          onClick={onClickPath ? handleClick : undefined}
        >
          <div className="flex items-center gap-2">
            {!!dynamicIconPath && <img className="size-10" src={dynamicIconPath} />}
            {!!iconPath && (
              <div className={cn('rounded-full p-3', iconBackgroundColor)}>
                <div className="flex size-5 items-center justify-center">
                  <img src={iconPath} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="wrap-break-words max-w-[300px] text-sm font-semibold text-gray-700">{name}</div>
                {description && (
                  <div className="text-subtle wrap-break-words max-w-[400px] text-gray-600">{description}</div>
                )}
              </div>
              {badge && (
                <Badge className="self-start" variant={badge.variant.variant}>
                  {badge.content}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex h-full items-center gap-2">
          {shared && (
            <div className="rounded-full border border-blue-300 p-2">
              <img src="/img/icons/upload-cloud-blue.svg" />
            </div>
          )}
          {(onDelete || onUpdate) && (
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
                  {onUpdate && (
                    <Button
                      className={`w-full justify-start text-sm text-gray-700`}
                      onClick={() => {
                        onUpdate();
                      }}
                      variant="link"
                    >
                      <Pencil className="text-gray-700" size={20} />
                      Modifier
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      className={`text-error-700 w-full justify-start text-sm`}
                      onClick={() => {
                        onDelete();
                      }}
                      variant="link"
                    >
                      <Trash className="text-error-700" size={20} />
                      Supprimer
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      {!!tags?.length && (
        <div className="flex flex-wrap gap-2" title={tags.join(', ')}>
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="light-gray">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge className="cursor-help" variant="light-gray">
              + {tags.length - 2} more
            </Badge>
          )}
        </div>
      )}
      {!!additionalContent && additionalContent}
    </div>
  );
}

export function ComponentCardSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-start gap-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <Skeleton className="h-6 w-[100px]" />
        </div>
      </div>
    </div>
  );
}
