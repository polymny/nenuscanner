import { Power } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useShutdown } from '@/api/mutations/system.mutations';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { Button } from '@/components/ui/button';

export default function PowerButton() {
  const [open, setOpen] = useState(false);
  const { mutate: shutdown, isPending } = useShutdown({
    onSuccess: () => {
      // Stays on screen: the page cannot reach the server anymore once it is off.
      toast.success(
        "Extinction en cours. Attendez que la LED de la Pi passe au rouge avant de couper l'alimentation.",
        {
          duration: Infinity,
        }
      );
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error("Impossible d'éteindre : une acquisition est en cours.");
      } else if (error.response?.status === 403) {
        toast.error("L'extinction n'est pas activée sur ce serveur.");
      } else {
        toast.error("Impossible d'éteindre le NenuScanner.");
      }
    },
  });

  return (
    <>
      <Button
        aria-label="Éteindre le NenuScanner"
        className="text-white"
        disabled={isPending}
        onClick={() => setOpen(true)}
        size="icon"
        title="Éteindre le NenuScanner"
        type="button"
        variant="link"
      >
        <Power className="size-6" />
      </Button>
      <ConfirmActionDialog
        confirmButtonContent="Éteindre"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Pour le rallumer, appuyez sur le bouton d'alimentation de la Pi, ou débranchez-la puis rebranchez-la."
        handleConfirmAction={() => shutdown()}
        open={open}
        setOpen={setOpen}
        title="Voulez-vous éteindre le NenuScanner ?"
      />
    </>
  );
}
