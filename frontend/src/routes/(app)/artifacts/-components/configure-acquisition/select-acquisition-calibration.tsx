import type { Dispatch } from 'react';

import type { ConfigureAcquisitionStep } from './configure-acquisition-dialog';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';

interface SelectAcquisitionCalibrationProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<ConfigureAcquisitionStep>;
}

const SelectAcquisitionCalibration = ({ setOpen, setCurrentStep }: SelectAcquisitionCalibrationProps) => {
  return (
    <>
      <DialogHeader>
        <DialogBackButton
          onClick={() => {
            setCurrentStep('scenario');
          }}
        />
        <DialogTitle>Sélectionner un étalonnage</DialogTitle>
      </DialogHeader>
      <div className="bg-gray-25 flex flex-col gap-5 p-6">
        <div className="text-sm font-bold text-gray-500">Tous les étalonnages</div>
      </div>
      <DialogFooter className="flex-col">
        <div className="flex justify-between">
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
            disabled
            size="lg"
            type="button"
            onClick={() => {
              setOpen(false);
            }}
          >
            Valider
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};

export default SelectAcquisitionCalibration;
