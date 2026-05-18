import { useFormContext } from 'react-hook-form';
import type { Dispatch } from 'react';
import type { CreateAcquisitionStep } from './create-acquisition-dialog';
import type { CreateAcquisitionPayload } from '@/schemas/acquisition.schemas';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SelectAcquisitionNameProps {
  setOpen: Dispatch<boolean>;
  setCurrentStep: Dispatch<CreateAcquisitionStep>;
}

const SelectAcquisitionName = ({ setOpen, setCurrentStep }: SelectAcquisitionNameProps) => {
  const form = useFormContext<CreateAcquisitionPayload>();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Créer une acquisition</DialogTitle>
        <DialogDescription>Veuillez entrer un nom pour cette nouvelle acquisition.</DialogDescription>
      </DialogHeader>
      <div className="bg-gray-25 flex flex-col gap-3 p-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input {...field} placeholder="Nom" />
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
          onClick={async () => {
            const isValid = await form.trigger(['name']);
            if (isValid) setCurrentStep('scenario');
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
