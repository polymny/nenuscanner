import type { Dispatch } from 'react';

import type { CreateAcquisitionStep } from './create-acquisition-dialog';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';

interface SelectAcquisitionCalibrationProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<CreateAcquisitionStep>;
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
      <FormField
        name="root"
        render={() => (
          <FormItem>
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
                <Button size="lg" type="submit">
                  Créer
                </Button>
              </div>
              <FormMessage className="text-end" />
            </DialogFooter>
          </FormItem>
        )}
      />
    </>
  );
};

export default SelectAcquisitionCalibration;
