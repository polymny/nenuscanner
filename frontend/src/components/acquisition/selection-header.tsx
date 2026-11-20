import { Download, X } from 'lucide-react';
import type { Selection } from '@/hooks/use-selection';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { cn } from '@/lib/utils';

interface SelectionHeaderProps {
  title: string;
  selectedText: string;
  selection: Selection;
  total: number;
  onDownload: () => void;
  downloading: boolean;
}

/**
 * Page title with selection controls. The controls on the right never move: selecting only swaps the title for the
 * selection count and tints the row, which then sticks to the top while scrolling.
 */
export default function SelectionHeader({
  title,
  selectedText,
  selection,
  total,
  onDownload,
  downloading,
}: SelectionHeaderProps) {
  const count = selection.selectedIds.length;

  return (
    <>
      <div
        className={cn(
          // px-5 + border lines the content up with the cards' content (border + p-3 + px-2).
          'flex min-h-14 items-center justify-between gap-6 rounded-lg border px-5 py-2',
          count > 0 ? 'bg-brand-50 border-brand-200 sticky top-0 z-10 shadow-sm' : 'border-transparent'
        )}
      >
        {count === 0 ? (
          <h2 className="font-semibold text-gray-950">{title}</h2>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              aria-label="Annuler la sélection"
              className="text-gray-600"
              onClick={selection.clear}
              title="Annuler la sélection (Échap)"
              variant="link"
            >
              <X className="size-5" />
            </Button>
            <span className="font-semibold text-gray-950">{selectedText}</span>
          </div>
        )}
        <div className="flex items-center gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={count === 0 ? false : count === total ? true : 'indeterminate'}
              disabled={total === 0}
              onCheckedChange={() => (count === total ? selection.clear() : selection.selectAll())}
            />
            Tout sélectionner
          </label>
          <Button disabled={count === 0 || downloading} onClick={onDownload}>
            <Download />
            Télécharger
          </Button>
        </div>
      </div>
      <ConfirmActionDialog
        confirmButtonContent="Quitter la page"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Votre sélection sera perdue."
        handleConfirmAction={() => selection.blocker.proceed?.()}
        open={selection.blocker.status === 'blocked'}
        setOpen={(open) => {
          if (!open) selection.blocker.reset?.();
        }}
        title="Quitter la page ?"
      />
    </>
  );
}
