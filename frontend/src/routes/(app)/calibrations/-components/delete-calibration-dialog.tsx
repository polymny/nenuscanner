import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Dispatch } from 'react';
import type { Acquisition } from '@/types/acquisition.types';
import { useDeleteAcquisition } from '@/api/mutations/acquisition.mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface DeleteCalibrationDialogProps {
  calibration: Acquisition | null;
  open: boolean;
  setOpen: Dispatch<boolean>;
}

function RelatedAcquisitionsSection({ items }: { items: Array<{ id: number; name: string }> }) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-gray-900">Acquisitions concernées</h4>
        <Badge variant="light-gray">{items.length}</Badge>
      </div>
      <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pl-1 text-sm text-gray-700">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-gray-400" />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DeleteCalibrationDialog({ calibration, open, setOpen }: DeleteCalibrationDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const { mutate: deleteCalibration, isPending: isDeletingCalibration } = useDeleteAcquisition({
    onSuccess: () => {
      toast.success('Étalonnage supprimé.');
      setOpen(false);
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  const relatedAcquisitions = calibration?.acquisitions ?? [];
  const hasRelatedAcquisitions = relatedAcquisitions.length > 0;
  const canDelete = !!calibration && (confirmed || !hasRelatedAcquisitions) && !isDeletingCalibration;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'étalonnage</DialogTitle>
        </DialogHeader>
        <div className="bg-gray-25 flex max-h-[50vh] flex-col gap-5 overflow-y-auto p-8">
          {calibration ? (
            <>
              <div className="bg-error-50 text-error-900 flex items-start gap-3 rounded-lg px-4 py-3 text-sm">
                <AlertTriangle className="text-error-600 mt-0.5 size-5 shrink-0" />
                <p className="leading-relaxed">
                  Cette action est irréversible. L'étalonnage{' '}
                  <span className="text-error-950 font-semibold">« {calibration.name} »</span> sera définitivement
                  supprimé
                  {hasRelatedAcquisitions
                    ? ', et les acquisitions listées ci-dessous n’auront plus d’étalonnage associé.'
                    : '.'}
                </p>
              </div>

              {hasRelatedAcquisitions && <RelatedAcquisitionsSection items={relatedAcquisitions} />}
            </>
          ) : (
            <p className="text-sm text-gray-600">Aucun étalonnage sélectionné.</p>
          )}

          {hasRelatedAcquisitions && (
            <div className="flex items-start gap-3 border-t border-gray-200 pt-4">
              <Checkbox
                checked={confirmed}
                disabled={!calibration}
                id="confirm-delete-calibration"
                onCheckedChange={(checked) => {
                  setConfirmed(checked === true);
                }}
              />
              <Label className="leading-snug font-normal text-gray-600" htmlFor="confirm-delete-calibration">
                Je confirme vouloir supprimer cet étalonnage et retirer son association aux acquisitions listées ci-dessus
              </Label>
            </div>
          )}
        </div>
        <DialogFooter className="items-center justify-between">
          <Button
            onClick={() => {
              setOpen(false);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Annuler
          </Button>
          <Button
            disabled={!canDelete}
            onClick={() => {
              if (!calibration) return;
              deleteCalibration(calibration.id);
            }}
            size="lg"
            type="button"
            variant="destructive"
          >
            Supprimer
            {isDeletingCalibration && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
