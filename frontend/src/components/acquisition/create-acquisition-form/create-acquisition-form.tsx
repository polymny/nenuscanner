import { useForm } from 'react-hook-form';
import { vineResolver } from '@hookform/resolvers/vine';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import type { Dispatch } from 'react';
import type { CreateAcquisitionPayload } from '@/schemas/acquisition.schemas';
import type { CreateAcquisitionStep } from '@/components/acquisition/create-acquisition-form/create-acquisition.types';
import SelectAcquisitionName from '@/components/acquisition/create-acquisition-form/select-acquisition-name';
import SelectAcquisitionScenario from '@/components/acquisition/create-acquisition-form/select-acquisition-scenario';
import { createAcquisitionSchema } from '@/schemas/acquisition.schemas';
import { useCreateAcquisition } from '@/api/mutations/acquisition.mutations';
import { Form } from '@/components/ui/form';
import SelectAcquisitionCalibration from '@/components/acquisition/create-acquisition-form/select-acquisition-calibration';

interface CreateAcquisitionFormProps {
  setOpen: Dispatch<boolean>;
  artifactId: number;
  currentStep: CreateAcquisitionStep;
  setCurrentStep: Dispatch<CreateAcquisitionStep>;
  onBackFromFirstStep?: () => void;
}

const CreateAcquisitionForm = ({
  setOpen,
  artifactId,
  currentStep,
  setCurrentStep,
  onBackFromFirstStep,
}: CreateAcquisitionFormProps) => {
  const navigate = useNavigate();
  const { mutate: createAcquisitionMutate } = useCreateAcquisition({
    onSuccess: ({ id }, { name }) => {
      toast.success(`${name} a bien été créée.`);
      setOpen(false);
      void navigate({ to: `/acquisitions/${id}` });
    },
  });

  const form = useForm<CreateAcquisitionPayload>({
    resolver: vineResolver(createAcquisitionSchema),
    defaultValues: {
      name: '',
      artifactId,
      scenarioId: null,
      calibrationId: null,
      withManualRotations: false,
      withRotationAutofocus: false,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          if (currentStep !== 'calibration') {
            event.preventDefault();
            return;
          }
          void form.handleSubmit((payload) => {
            createAcquisitionMutate(payload);
          })(event);
        }}
      >
        {currentStep === 'name' ? (
          <SelectAcquisitionName onBack={onBackFromFirstStep} setOpen={setOpen} setCurrentStep={setCurrentStep} />
        ) : currentStep === 'scenario' ? (
          <SelectAcquisitionScenario setOpen={setOpen} setCurrentStep={setCurrentStep} />
        ) : (
          <SelectAcquisitionCalibration setOpen={setOpen} setCurrentStep={setCurrentStep} />
        )}
      </form>
    </Form>
  );
};

export default CreateAcquisitionForm;
