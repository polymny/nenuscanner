import { useState } from 'react';
import { Amphora } from 'lucide-react';
import type { Dispatch } from 'react';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import { ComponentCardSkeleton } from '@/components/component-card';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { FlatRadioGroupItem, RadioGroup } from '@/components/ui/radio-group';
import { useMinimumLoadingDuration } from '@/hooks/use-minimum-loading-duration';
import { cn } from '@/lib/utils';

interface SelectAcquisitionArtifactProps {
  setOpen: Dispatch<boolean>;
  onBack: () => void;
  onContinue: (artifactId: number) => void;
}

const SelectAcquisitionArtifact = ({ setOpen, onBack, onContinue }: SelectAcquisitionArtifactProps) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<number | null>(null);
  const { data: artifacts = [], isPending: isLoadingArtifacts } = useGetArtifacts();
  const showSkeleton = useMinimumLoadingDuration(isLoadingArtifacts);

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
        ) : isLoadingArtifacts ? null : !artifacts.length ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200">
            <div className="rounded-full border border-gray-200 bg-white p-3">
              <Amphora className="text-brand-600 size-6" />
            </div>
            <h4 className="font-semibold">Aucun objet trouvé</h4>
            <span className="text-sm text-gray-600">Créez d&apos;abord un objet depuis la page Objets</span>
          </div>
        ) : (
          <RadioGroup
            className="no-scrollbar grid h-full grid-cols-2 gap-4 overflow-y-auto py-0.5"
            value={selectedArtifactId?.toString() ?? ''}
          >
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
                  <span
                    className={cn('truncate text-sm font-semibold text-gray-900')}
                    title={artifact.name}
                  >
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

export default SelectAcquisitionArtifact;
