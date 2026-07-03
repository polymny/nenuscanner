import { useState } from 'react';
import { Amphora, RulerDimensionLine } from 'lucide-react';
import type { Dispatch } from 'react';
import type { AcquisitionKind } from '@/components/acquisition/create-acquisition-form/create-acquisition.types';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AcquisitionKindOption {
  kind: AcquisitionKind;
  title: string;
  description: string;
  icon: typeof Amphora;
  iconClassName: string;
  iconBackgroundClassName: string;
}

const acquisitionKindOptions: Array<AcquisitionKindOption> = [
  {
    kind: 'object',
    title: "Acquisition d'objet",
    description: 'Photographier un objet pour créer un modèle 3D',
    icon: Amphora,
    iconClassName: 'text-brand-600',
    iconBackgroundClassName: 'bg-brand-100 group-hover:bg-brand-200',
  },
  {
    kind: 'calibration',
    title: 'Étalonnage',
    description: 'Étalonner le scanner avant une nouvelle acquisition',
    icon: RulerDimensionLine,
    iconClassName: 'text-violet-600',
    iconBackgroundClassName: 'bg-violet-100 group-hover:bg-violet-200',
  },
];

interface SelectAcquisitionKindProps {
  setOpen: Dispatch<boolean>;
  onContinue: (kind: AcquisitionKind) => void;
}

const SelectAcquisitionKind = ({ setOpen, onContinue }: SelectAcquisitionKindProps) => {
  const [selectedKind, setSelectedKind] = useState<AcquisitionKind | null>(null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Créer une acquisition</DialogTitle>
        <DialogDescription>Que souhaitez-vous faire ?</DialogDescription>
      </DialogHeader>
      <div className="bg-gray-25 flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          {acquisitionKindOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedKind === option.kind;

            return (
              <button
                className={cn(
                  'group focus-visible:ring-brand-600 flex flex-col items-center gap-4 rounded-xl border-2 p-8 text-center transition-all focus-visible:ring-2 focus-visible:outline-none',
                  isSelected
                    ? 'border-brand-600 bg-brand-50 shadow-sm'
                    : 'hover:border-brand-300 hover:bg-brand-50/40 border-gray-200 bg-white'
                )}
                key={option.kind}
                onClick={() => {
                  setSelectedKind(option.kind);
                }}
                type="button"
              >
                <div
                  className={cn(
                    'rounded-full p-5 transition-colors',
                    isSelected ? 'bg-brand-600' : option.iconBackgroundClassName
                  )}
                >
                  <Icon className={cn('size-8', isSelected ? 'text-white' : option.iconClassName)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-semibold text-gray-900">{option.title}</span>
                  <span className="text-sm text-gray-500">{option.description}</span>
                </div>
              </button>
            );
          })}
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
          disabled={!selectedKind}
          onClick={() => {
            if (selectedKind) onContinue(selectedKind);
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

export default SelectAcquisitionKind;
