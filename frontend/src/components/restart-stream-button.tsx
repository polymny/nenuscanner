import { RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRestartStream } from '@/api/mutations/camera.mutations';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Icon button restarting MediaMTX; the player reconnects on its own once the stream is back. */
export default function RestartStreamButton({ className }: { className?: string }) {
  const { mutate: restartStream, isPending } = useRestartStream({
    onSuccess: () => {
      toast.success('Flux vidéo redémarré.');
    },
    onError: () => {
      toast.error('Impossible de redémarrer le flux vidéo.');
    },
  });

  return (
    <Button
      aria-label="Redémarrer le flux vidéo"
      className={className}
      disabled={isPending}
      onClick={() => restartStream()}
      size="icon"
      title="Redémarrer le flux vidéo"
      type="button"
      variant="ghost"
    >
      <RotateCw className={cn('size-4', isPending && 'animate-spin')} />
    </Button>
  );
}
