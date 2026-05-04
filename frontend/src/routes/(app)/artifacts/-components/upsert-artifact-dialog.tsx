import { vineResolver } from '@hookform/resolvers/vine';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { Dispatch } from 'react';
import type { UpsertArtifactPayload } from '@/schemas/artifact.schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpsertArtifact } from '@/api/mutations/artifact.mutations';
import { upsertArtifactSchema } from '@/schemas/artifact.schemas';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetArtifacts } from '@/api/queries/artifact.queries';

interface UpsertArtifactDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  artifactId?: number;
  mode: 'create' | 'update';
}

const UpsertArtifactDialog = ({ open, setOpen, artifactId, mode }: UpsertArtifactDialogProps) => {
  const { data: artifacts } = useGetArtifacts();
  const existingArtifact = useMemo(
    () => artifacts?.find((artifact) => artifact.id === artifactId),
    [artifacts, artifactId]
  );

  const { isPending: isUpsertingArtifact, mutate: upsertArtifactMutate } = useUpsertArtifact(mode, {
    onSuccess: (_, { name }) => {
      setOpen(false);
      toast.success(`${name} a bien été ${mode === 'create' ? 'créé' : 'modifié'}.`);
      setTimeout(() => {
        form.reset();
      }, 1000);
    },
  });

  const form = useForm<UpsertArtifactPayload>({
    resolver: vineResolver(upsertArtifactSchema),
    values: {
      name: existingArtifact?.name ?? '',
      id: mode === 'create' ? undefined : existingArtifact?.id,
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((payload) => {
              upsertArtifactMutate(payload);
            })}
            className="flex flex-col"
          >
            <DialogHeader>
              <DialogTitle>{mode === 'create' ? 'Créer un nouvel objet' : "Modifier l'objet"}</DialogTitle>
              <DialogDescription>{`Veuillez entrer un nom pour ${mode === 'create' ? 'ce nouvel' : 'cet'} objet.`}</DialogDescription>
            </DialogHeader>
            <div className="bg-gray-25 flex flex-col gap-3 p-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input {...field} placeholder="Nom de l'objet" />
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
              <Button disabled={!form.watch('name') || isUpsertingArtifact} size="lg" type="submit">
                Valider
                {isUpsertingArtifact && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertArtifactDialog;
