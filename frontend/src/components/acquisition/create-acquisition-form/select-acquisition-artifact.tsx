import { useEffect, useState } from 'react';
import { vineResolver } from '@hookform/resolvers/vine';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Amphora, Check, Plus, X } from 'lucide-react';
import type { Dispatch } from 'react';
import type { UpsertArtifactPayload } from '@/schemas/artifact.schemas';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import { useUpsertArtifact } from '@/api/mutations/artifact.mutations';
import { upsertArtifactSchema } from '@/schemas/artifact.schemas';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';

interface SelectAcquisitionArtifactProps {
  setOpen: Dispatch<boolean>;
  onBack: () => void;
  onContinue: (artifactId: number) => void;
}

const SelectAcquisitionArtifact = ({ setOpen, onBack, onContinue }: SelectAcquisitionArtifactProps) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<number | null>(null);
  const { data: artifacts = [], isPending: isLoadingArtifacts } = useGetArtifacts();
  const showSkeleton = useMinimumLoadingDuration(isLoadingArtifacts);

  // A freshly created artifact lands at the end of the list: bring it into view once it shows up.
  useEffect(() => {
    if (selectedArtifactId === null) return;
    document.querySelector(`[role="radio"][value="${selectedArtifactId}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedArtifactId, artifacts]);

  return (
    <>
      <DialogHeader>
        <DialogBackButton onClick={onBack} />
        <DialogTitle>Sélectionner un objet</DialogTitle>
      </DialogHeader>
      <div className="bg-gray-25 flex h-[50vh] flex-col gap-5 p-6">
        <div className="text-sm font-bold text-gray-500">Objets disponibles</div>
        {showSkeleton ? (
          <div className="grid w-full grid-cols-2 gap-4">
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
            <ComponentCardSkeleton />
          </div>
        ) : isLoadingArtifacts ? null : (
          <RadioGroup
            className="no-scrollbar grid h-full auto-rows-max grid-cols-2 gap-4 overflow-y-auto py-0.5"
            value={selectedArtifactId?.toString() ?? ''}
          >
            <NewArtifactTile onCreated={setSelectedArtifactId} />
            {artifacts.map((artifact) => (
              <FlatRadioGroupItem
                className="h-max items-center"
                key={artifact.id}
                onClick={() => {
                  setSelectedArtifactId((current) => (current === artifact.id ? null : artifact.id));
                }}
                value={artifact.id.toString()}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-brand-100 flex size-10 shrink-0 items-center justify-center rounded-full">
                    <Amphora className="text-brand-600 size-5" />
                  </div>
                  <span className="truncate text-sm font-semibold text-gray-900" title={artifact.name}>
                    {artifact.name}
                  </span>
                </div>
              </FlatRadioGroupItem>
            ))}
          </RadioGroup>
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
          disabled={!selectedArtifactId}
          onClick={() => {
            if (selectedArtifactId) onContinue(selectedArtifactId);
          }}
          size="lg"
          type="button"
        >
          Continuer
        </Button>
      </DialogFooter>
    </>
  );
};

/** First tile of the list: turns into an inline name field, and selects the artifact once created. */
const NewArtifactTile = ({ onCreated }: { onCreated: (artifactId: number) => void }) => {
  const [editing, setEditing] = useState(false);
  const form = useForm<UpsertArtifactPayload>({
    resolver: vineResolver(upsertArtifactSchema),
    defaultValues: { name: '' },
  });
  const close = () => {
    form.reset();
    setEditing(false);
  };
  const { mutate: createArtifact, isPending } = useUpsertArtifact('create', {
    onSuccess: ({ id, name }) => {
      toast.success(`${name} a bien été créé.`);
      close();
      onCreated(id);
    },
    onError: () => {
      toast.error("La création de l'objet a échoué.");
    },
  });

  if (!editing) {
    return (
      <button
        className="group hover:border-brand-400 hover:bg-brand-50 flex h-max items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 px-3 py-[15px] text-left transition-colors"
        onClick={() => setEditing(true)}
        type="button"
      >
        <div className="group-hover:border-brand-200 flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
          <Plus className="text-brand-600 size-5" />
        </div>
        <span className="text-brand-600 text-sm font-semibold">Nouvel objet</span>
      </button>
    );
  }

  return (
    <Form {...form}>
      <form
        className="border-brand-600 col-span-2 flex h-max items-start gap-2 rounded-lg border bg-white p-3"
        onSubmit={form.handleSubmit((payload) => createArtifact(payload))}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input autoFocus placeholder="Nom de l'objet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button aria-label="Créer l'objet" disabled={!form.watch('name') || isPending} size="icon" type="submit">
          <Check />
        </Button>
        <Button aria-label="Annuler" onClick={close} size="icon" type="button" variant="outline">
          <X />
        </Button>
      </form>
    </Form>
  );
};

export default SelectAcquisitionArtifact;
