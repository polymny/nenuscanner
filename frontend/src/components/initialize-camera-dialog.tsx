import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api-types';
import { useChangeCamera } from '@/api/mutations/camera.mutations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function isCameraNotInitialized(error: AxiosError<ApiError> | null | undefined) {
  return error?.response?.data.message === 'camera-not-initialized';
}

export function isNotRealCamera(error: AxiosError<ApiError> | null | undefined) {
  return error?.response?.data.message === 'not-real-camera';
}

interface InitializeCameraDialogProps {
  open: boolean;
  onInitialized?: () => void;
}

export default function InitializeCameraDialog({ open, onInitialized }: InitializeCameraDialogProps) {
  const { mutate: changeCamera, isPending } = useChangeCamera({
    onSuccess: () => {
      toast.success('Caméra initialisée.');
      onInitialized?.();
    },
    onError: (error) => {
      if (isNotRealCamera(error)) {
        toast.error('Une caméra réelle est requise pour initialiser les réglages.');
        return;
      }
      toast.error("Impossible d'initialiser la caméra.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-max [&>button]:hidden" onEscapeKeyDown={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Initialisation de la caméra</DialogTitle>
          <DialogDescription>
            Les réglages caméra ne sont pas encore disponibles. Connectez l&apos;appareil puis initialisez-le pour
            continuer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-end border-t-0">
          <Button disabled={isPending} onClick={() => changeCamera()} size="lg" type="button">
            <Camera className="size-4" />
            Initialiser la caméra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
