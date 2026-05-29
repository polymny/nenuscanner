import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Dispatch } from 'react';
import type { Scenario } from '@/types/scenario.types';
import { useDeleteScenario } from '@/api/mutations/scenario.mutations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface DeleteScenarioDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  scenario: Scenario | null;
}

interface RelatedItemsSectionProps {
  items: Array<{ id: number; name: string }>;
  title: string;
}

function RelatedItemsSection({ items, title }: RelatedItemsSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="text-sm font-semibold text-gray-950">{title}</span>
        <Badge variant="light-gray">{items.length}</Badge>
      </div>
      <div className="max-h-36 overflow-y-auto">
        <Table>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-2.5 font-normal text-gray-700">{item.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function DeleteScenarioDialog({ open, setOpen, scenario }: DeleteScenarioDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const { mutate: deleteScenario, isPending: isDeletingScenario } = useDeleteScenario({
    onSuccess: () => {
      toast.success('Scénario supprimé.');
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

  const acquisitions = scenario?.acquisitions ?? [];
  const calibrations = scenario?.calibrations ?? [];
  const hasRelatedItems = acquisitions.length > 0 || calibrations.length > 0;
  const canDelete = !!scenario && confirmed && !isDeletingScenario;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le scénario</DialogTitle>
          <DialogDescription>
            Vérifiez les éléments qui seront supprimés, puis confirmez votre choix.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-25 flex max-h-[50vh] flex-col gap-5 overflow-y-auto p-8">
          <Alert
            className="flex items-start gap-3 border-error-200 bg-error-50 px-4 py-4 text-error-800"
            variant="destructive"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error-100">
              <AlertTriangle className="size-5 text-error-700" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
              <AlertTitle className="text-sm leading-none font-semibold text-error-900">Action irréversible</AlertTitle>
              <AlertDescription className="text-error-800/90 leading-relaxed">
                {scenario ? (
                  <>
                    Le scénario{' '}
                    <span className="font-semibold text-error-950">« {scenario.name} »</span> sera définitivement
                    supprimé
                    {hasRelatedItems ? ', ainsi que les éléments listés ci-dessous.' : '.'}
                  </>
                ) : (
                  'Cette action ne peut pas être annulée.'
                )}
              </AlertDescription>
            </div>
          </Alert>

          {hasRelatedItems ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <RelatedItemsSection items={acquisitions} title="Acquisitions" />
              {acquisitions.length > 0 && calibrations.length > 0 && <Separator />}
              <RelatedItemsSection items={calibrations} title="Étalonages" />
            </div>
          ) : (
            <p className="text-sm text-gray-600">Aucune acquisition ni étalonnage associé à ce scénario.</p>
          )}

          <Separator />

          <div className="flex items-start gap-3">
            <Checkbox
              checked={confirmed}
              disabled={!scenario}
              id="confirm-delete-scenario"
              onCheckedChange={(checked) => {
                setConfirmed(checked === true);
              }}
            />
            <Label className="font-normal leading-snug text-gray-600" htmlFor="confirm-delete-scenario">
              Je confirme vouloir supprimer ce scénario
              {hasRelatedItems ? ' et les éléments listés ci-dessus' : ''}
            </Label>
          </div>
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
              if (!scenario) return;
              deleteScenario(scenario.id);
            }}
            size="lg"
            type="button"
            variant="destructive"
          >
            Supprimer
            {isDeletingScenario && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
