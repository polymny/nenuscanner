import { vineResolver } from '@hookform/resolvers/vine';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import type { Dispatch } from 'react';
import type { DuplicateScenarioPayload } from '@/schemas/scenario.schemas';
import { duplicateScenarioSchema } from '@/schemas/scenario.schemas';
import { useDuplicateScenario } from '@/api/mutations/scenario.mutations';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DuplicateScenarioDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  sourceScenarioId: number | null;
}

export default function DuplicateScenarioDialog({ open, setOpen, sourceScenarioId }: DuplicateScenarioDialogProps) {
  const navigate = useNavigate();
  const {
    isPending: isDuplicatingScenario,
    mutate: duplicateScenarioMutate,
    isSuccess,
  } = useDuplicateScenario({
    onSuccess: (data, { name }) => {
      toast.success(`${name} a bien été dupliqué.`);
      setTimeout(() => {
        navigate({ to: `/scenarios/${data.id}` });
        setOpen(false);
      }, 500);
    },
    onError: () => {
      toast.error('La duplication a échoué.');
    },
  });

  const form = useForm<DuplicateScenarioPayload>({
    resolver: vineResolver(duplicateScenarioSchema),
    defaultValues: {
      sourceScenarioId: sourceScenarioId ?? 0,
      name: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      sourceScenarioId: sourceScenarioId ?? 0,
      name: '',
    });
  }, [form, open, sourceScenarioId]);

  const canSubmit = form.formState.isValid && !isDuplicatingScenario && !!sourceScenarioId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((payload) => {
              if (!sourceScenarioId) return;
              duplicateScenarioMutate(payload);
            })}
            className="flex flex-col"
          >
            <DialogHeader>
              <DialogTitle>Dupliquer le scénario</DialogTitle>
              <DialogDescription>Choisissez un nom pour le nouveau scénario.</DialogDescription>
            </DialogHeader>
            <div className="bg-gray-25 flex flex-col gap-3 p-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du scénario" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button disabled={!canSubmit || isSuccess} size="lg" type="submit">
                Dupliquer
                {isDuplicatingScenario && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
