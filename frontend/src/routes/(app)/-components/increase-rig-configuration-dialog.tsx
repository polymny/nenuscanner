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
import { useGetLastRigConfiguration } from '@/api/queries/rig-configuration.queries';
import { useIncreaseRigConfiguration } from '@/api/mutations/rig-configuration.mutations';
import { cn } from '@/lib/utils';

export default function IncreaseRigConfigurationDialog() {
  const [open, setOpen] = useState(false);
  const { data: lastRigConfiguration } = useGetLastRigConfiguration();

  const {
    mutate: increaseRigConfiguration,
    isSuccess,
    reset,
  } = useIncreaseRigConfiguration({
    onSuccess: () => {
      toast.success('Rig mis à jour.');
      setTimeout(() => {
        setOpen(false);
      }, 1200);
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const [isPulsing, setIsPulsing] = useState(false);
  const previousRigKey = useRef<string | undefined>(undefined);
  const RigKey = useMemo(
    () => (lastRigConfiguration ? `${lastRigConfiguration.emojiLeft}-${lastRigConfiguration.emojiRight}` : undefined),
    [lastRigConfiguration]
  );

  useEffect(() => {
    if (!RigKey) return;
    if (previousRigKey.current === undefined) {
      previousRigKey.current = RigKey;
      return;
    }
    if (previousRigKey.current === RigKey) return;
    previousRigKey.current = RigKey;

    setIsPulsing(true);
    const timeout = setTimeout(() => setIsPulsing(false), 400);
    return () => clearTimeout(timeout);
  }, [RigKey]);

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
            <DraftingCompass className="size-4" /> Rig modifié
          </div>
          <div className="flex h-full min-w-[70px] items-center justify-center gap-1 bg-orange-100 px-3 text-lg text-gray-900">
            <span>{lastRigConfiguration?.emojiLeft}</span>
            <span>{lastRigConfiguration?.emojiRight}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-max">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            <span className={cn('inline-block transition-transform duration-500 ease-out', isPulsing && 'scale-150')}>
              {lastRigConfiguration?.emojiLeft}
              {lastRigConfiguration?.emojiRight}
            </span>
          </DialogTitle>
          <DialogDescription>Vous avez modifié le rig ? Mettez le à jour pour continuer.</DialogDescription>
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
              increaseRigConfiguration();
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
