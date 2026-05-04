import type { Dispatch } from 'react';
import type { VariantProps } from 'class-variance-authority';

import type { buttonVariants } from './ui/button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmActionDialogProps {
  confirmButtonContent: string;
  confirmButtonVariant: VariantProps<typeof buttonVariants>;
  description: string;
  handleConfirmAction: () => void;
  open: boolean;
  setOpen: Dispatch<boolean>;
  title: string;
}

export default function ConfirmActionDialog({
  confirmButtonContent,
  confirmButtonVariant,
  description,
  handleConfirmAction,
  open,
  setOpen,
  title,
}: ConfirmActionDialogProps) {
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="w-max">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center justify-between border-t-0">
          <Button
            onClick={() => {
              setOpen(false);
            }}
            size="sm"
            variant="outline"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              handleConfirmAction();
              setOpen(false);
            }}
            size="lg"
            variant="default"
            {...confirmButtonVariant}
          >
            {confirmButtonContent}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
