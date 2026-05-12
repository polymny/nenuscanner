import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Dispatch } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetLastArmsPosition } from '@/api/queries/arms-position.queries';
import { useIncreaseArmsPosition } from '@/api/mutations/arms-position.mutations';

interface IncreaseArmsPositionDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
}

export default function IncreaseArmsPositionDialog({ open, setOpen }: IncreaseArmsPositionDialogProps) {
  const { data: lastArmsPosition } = useGetLastArmsPosition();

  const {
    mutate: increaseArmsPosition,
    isSuccess,
    reset,
  } = useIncreaseArmsPosition({
    onSuccess: () => {
      toast.success('Position des bras mise à jour.');
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="w-max">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {lastArmsPosition?.emojiLeft}
            {lastArmsPosition?.emojiRight}
          </DialogTitle>
          <DialogDescription>
            Vous avez bougé les bras ? Mettez à jour la position des bras pour continuer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center justify-between border-t-0">
          <Button
            onClick={() => {
              setOpen(false);
            }}
            disabled={isSuccess}
            size="sm"
            variant="outline"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              increaseArmsPosition();
            }}
            size="lg"
            variant="default"
            disabled={isSuccess}
          >
            Mettre à jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
