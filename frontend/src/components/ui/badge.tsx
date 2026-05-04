import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xl border text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
    variants: {
      size: {
        lg: 'px-2 py-0.5',
        md: 'px-[10px] py-1',
        sm: 'px-3 py-2',
      },
      variant: {
        'brand': 'border-brand-200 bg-brand-50 text-brand-600 [a&]:hover:bg-brand-50/90',
        'default': 'border-gray-100 bg-gray-50 text-gray-700 [a&]:hover:bg-gray-50/90',
        'error': 'border-error-200 bg-error-50 text-error-700 [a&]:hover:bg-error-50/90',
        'gray': 'text-gray-25 rounded-md border-none bg-gray-500',
        'light-gray': 'rounded-md border-none bg-gray-100 text-gray-700',
        'pink': 'border-pink-200 bg-pink-50 text-pink-700 [a&]:hover:bg-pink-50/90',
        'purple': 'rounded-md border-none border-purple-200 bg-purple-50 text-purple-700 [a&]:hover:bg-purple-50/90',
        'sky': 'border-sky-200 bg-sky-50 text-sky-700 [a&]:hover:bg-sky-50/90',
        'success': 'border-success-200 bg-success-50 text-success-700 [a&]:hover:bg-success-50/90',
        'warning': 'border-warning-200 bg-warning-50 text-warning-700 [a&]:hover:bg-warning-50/90',
      },
    },
  }
);

function Badge({
  asChild = false,
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return <Comp className={cn(badgeVariants({ variant }), className)} data-slot="badge" {...props} />;
}

export { Badge, badgeVariants };
