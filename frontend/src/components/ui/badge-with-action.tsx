import { Badge } from './badge';
import { Button } from './button';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeWithActionProps {
  Icon: LucideIcon;
  iconColor: string;
  action?: () => void;
}

export function BadgeWithAction({
  Icon,
  action,
  className,
  content,
  iconColor,
  ...props
}: React.ComponentProps<typeof Badge> & BadgeWithActionProps) {
  return (
    <Badge
      className={cn('transition-transform duration-100 ease-out hover:-translate-y-1 hover:scale-110', className)}
      {...props}
    >
      {content}
      {action && (
        <Button
          variant="link"
          size="icon"
          className={cn('ml-1 h-4 w-4', iconColor)}
          onClick={() => {
            action();
          }}
        >
          <Icon className="h-4 w-4" />
        </Button>
      )}
    </Badge>
  );
}
