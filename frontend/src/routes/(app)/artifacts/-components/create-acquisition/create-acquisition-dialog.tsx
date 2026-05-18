import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { vineResolver } from '@hookform/resolvers/vine';
import { toast } from 'sonner';
import SelectAcquisitionScenario from './select-acquisition-scenario';
import SelectAcquisitionCalibration from './select-acquisition-calibration';
import SelectAcquisitionName from './select-acquisition-name';
import type { Dispatch } from 'react';
import type { CreateAcquisitionPayload } from '@/schemas/acquisition.schemas';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { createAcquisitionSchema } from '@/schemas/acquisition.schemas';
import { useCreateAcquisition } from '@/api/mutations/acquisition.mutations';
import { Form } from '@/components/ui/form';

export type CreateAcquisitionStep = 'name' | 'scenario' | 'calibration';

interface CreateAcquisitionDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  artifactId: number;
}

const CreateAcquisitionDialog = ({ open, setOpen, artifactId }: CreateAcquisitionDialogProps) => {
  const [currentStep, setCurrentStep] = useState<CreateAcquisitionStep>('scenario');

  const { mutate: createAcquisitionMutate } = useCreateAcquisition({
    onSuccess: (_, { name }) => {
      setOpen(false);
      toast.success(`${name} a bien été créée.`);
      setTimeout(() => {
        form.reset();
      }, 1000);
    },
  });

  const form = useForm<CreateAcquisitionPayload>({
    resolver: vineResolver(createAcquisitionSchema),
    defaultValues: {
      name: '',
      artifactId,
      scenarioId: null,
      calibrationId: null,
      withRotationAutofocus: false,
    },
  });

  useEffect(() => {
    if (open) {
      setCurrentStep('name');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((payload) => {
              createAcquisitionMutate(payload);
            })}
          >
            {currentStep === 'name' ? (
              <SelectAcquisitionName setOpen={setOpen} setCurrentStep={setCurrentStep} />
            ) : currentStep === 'scenario' ? (
              <SelectAcquisitionScenario setOpen={setOpen} setCurrentStep={setCurrentStep} />
            ) : (
              <SelectAcquisitionCalibration setOpen={setOpen} setCurrentStep={setCurrentStep} />
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAcquisitionDialog;
