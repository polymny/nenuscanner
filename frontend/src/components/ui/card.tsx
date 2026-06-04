import type * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-card-foreground flex flex-col rounded-xl border border-gray-200 bg-white shadow-md',
        className
      )}
      data-slot="card"
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      data-slot="card-action"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col p-6', className)} data-slot="card-content" {...props} />;
}

function CardContentItem({
  className,
  itemKey,
  itemValue,
  ...props
}: React.ComponentProps<'div'> & { itemKey: string; itemValue: string }) {
  return (
    <div
      className={cn('flex justify-between py-2 text-sm text-gray-600', className)}
      data-slot={`card-content-${itemKey}`}
      {...props}
    >
      <span>{itemKey}</span>
      <span className="font-semibold">{itemValue}</span>
    </div>
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-muted-foreground text-sm', className)} data-slot="card-description" {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-gray-25 flex items-center rounded-b-xl border-t p-4', className)}
      data-slot="card-footer"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start border-b p-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-lg font-semibold text-gray-950', className)} data-slot="card-title" {...props} />;
}

export { Card, CardAction, CardContent, CardContentItem, CardDescription, CardFooter, CardHeader, CardTitle };
