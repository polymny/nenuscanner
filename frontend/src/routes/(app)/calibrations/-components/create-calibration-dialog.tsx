import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { vineResolver } from '@hookform/resolvers/vine';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import type { Dispatch } from 'react';
import type { CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import SelectAcquisitionName from '@/components/acquisition/create-acquisition-form/select-acquisition-name';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { createCalibrationSchema } from '@/schemas/acquisition.schemas';
import { useCreateCalibration } from '@/api/mutations/acquisition.mutations';
import { Form } from '@/components/ui/form';
import SelectAcquisitionScenario from '@/components/acquisition/create-acquisition-form/select-acquisition-scenario';

export type CreateCalibrationStep = 'name' | 'scenario' | 'calibration';

interface CreateCalibrationDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
}

const CreateCalibrationDialog = ({ open, setOpen }: CreateCalibrationDialogProps) => {
  const [currentStep, setCurrentStep] = useState<CreateCalibrationStep>('name');
  const navigate = useNavigate();
  const { mutate: createCalibrationMutate } = useCreateCalibration({
    onSuccess: ({ id }, { name }) => {
      toast.success(`${name} a bien été créée.`);
      navigate({ to: `/acquisitions/${id}` });
    },
  });

  const form = useForm<CreateCalibrationPayload>({
    resolver: vineResolver(createCalibrationSchema),
    defaultValues: {
      name: '',
      scenarioId: null,
      withManualRotations: false,
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
            onSubmit={(event) => {
              if (currentStep !== 'scenario') {
                event.preventDefault();
                return;
              }
              void form.handleSubmit((payload) => {
                createCalibrationMutate(payload);
              })(event);
            }}
          >
            {currentStep === 'name' ? (
              <SelectAcquisitionName setOpen={setOpen} setCurrentStep={setCurrentStep} isCalibration={true} />
            ) : (
              <SelectAcquisitionScenario setOpen={setOpen} setCurrentStep={setCurrentStep} isCalibration={true} />
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCalibrationDialog;
