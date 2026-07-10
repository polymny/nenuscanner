import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DialogTrigger } from '@radix-ui/react-dialog';

import { DraftingCompass } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function IncreaseArmsPositionDialog() {
  const [open, setOpen] = useState(false);
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
      }, 1200);
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const [isPulsing, setIsPulsing] = useState(false);
  const previousPositionKey = useRef<string | undefined>(undefined);
  const positionKey = useMemo(
    () => (lastArmsPosition ? `${lastArmsPosition.emojiLeft}-${lastArmsPosition.emojiRight}` : undefined),
    [lastArmsPosition]
  );

  useEffect(() => {
    if (!positionKey) return;
    if (previousPositionKey.current === undefined) {
      previousPositionKey.current = positionKey;
      return;
    }
    if (previousPositionKey.current === positionKey) return;
    previousPositionKey.current = positionKey;

    setIsPulsing(true);
    const timeout = setTimeout(() => setIsPulsing(false), 400);
    return () => clearTimeout(timeout);
  }, [positionKey]);

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="text-brand-600 h-[42px] overflow-hidden border-none bg-orange-300 p-0 hover:bg-orange-400"
        >
          <div className="flex items-center gap-2 px-3">
            <DraftingCompass className="size-4" /> J'ai bougé les bras
          </div>
          <div className="flex h-full min-w-[70px] items-center justify-center gap-1 bg-orange-100 px-3 text-lg text-gray-900">
            <span>{lastArmsPosition?.emojiLeft}</span>
            <span>{lastArmsPosition?.emojiRight}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-max">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            <span className={cn('inline-block transition-transform duration-500 ease-out', isPulsing && 'scale-150')}>
              {lastArmsPosition?.emojiLeft}
              {lastArmsPosition?.emojiRight}
            </span>
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
