import { useFormContext } from 'react-hook-form';
import type { Dispatch } from 'react';
import type { CreateAcquisitionPayload, CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DialogBackButton from '@/components/ui/dialog-back-button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SelectAcquisitionNameProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<'name' | 'scenario'>;
  isCalibration?: boolean;
  onBack?: () => void;
}

const SelectAcquisitionName = ({
  setOpen,
  setCurrentStep,
  isCalibration = false,
  onBack,
}: SelectAcquisitionNameProps) => {
  const form = useFormContext<CreateAcquisitionPayload | CreateCalibrationPayload>();

  const handleContinue = async () => {
    const isValid = await form.trigger(['name']);
    if (isValid) setCurrentStep('scenario');
  };

  return (
    <>
      <DialogHeader>
        {onBack && <DialogBackButton onClick={onBack} />}
        <DialogTitle>{isCalibration ? 'Créer un étalonnage' : 'Créer une acquisition'}</DialogTitle>
        <DialogDescription>
          Veuillez entrer un nom pour {isCalibration ? 'ce nouvel étalonnage' : 'cette nouvelle acquisition'}.
        </DialogDescription>
      </DialogHeader>
      <div className="bg-gray-25 flex flex-col gap-3 p-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nom"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleContinue();
                    }
                  }}
                />
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
        <Button
          disabled={!form.watch('name')}
          onClick={() => {
            void handleContinue();
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

export default SelectAcquisitionName;
