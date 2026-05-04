import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:border disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'border border-transparent px-6 py-[14px] has-[>svg]:px-3',
        icon: 'p-[10px]',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        md: 'gap-1.5 rounded-md px-4 py-[10px] has-[>svg]:px-2.5',
        sm: 'gap-1.5 rounded-md px-3 py-2 has-[>svg]:px-2.5',
      },
      variant: {
        default: 'bg-brand-600 hover:bg-brand-600/90 border border-transparent text-white',
        destructive: 'bg-error-600 hover:bg-error-600/90 border-error-700 border text-white',
        link: 'text-brand-800 p-0 disabled:border-none disabled:bg-transparent has-[>svg]:p-0',
        outline: 'hover:bg-accent hover:text-accent-foreground border border-gray-300 bg-white text-gray-800',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs',
      },
    },
  }
);

function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return <Comp className={cn(buttonVariants({ className, size, variant }))} data-slot="button" {...props} />;
}

export { Button, buttonVariants };
