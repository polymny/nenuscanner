import { useForm } from 'react-hook-form';
import { vineResolver } from '@hookform/resolvers/vine';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import type { Dispatch } from 'react';
import type { CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import type {
  CreateAcquisitionStep,
  CreateCalibrationStep,
} from '@/components/acquisition/create-acquisition-form/create-acquisition.types';
import SelectAcquisitionName from '@/components/acquisition/create-acquisition-form/select-acquisition-name';
import { createCalibrationSchema } from '@/schemas/acquisition.schemas';
import { useCreateCalibration } from '@/api/mutations/acquisition.mutations';
import { Form } from '@/components/ui/form';
import SelectAcquisitionScenario from '@/components/acquisition/create-acquisition-form/select-acquisition-scenario';

interface CreateCalibrationFormProps {
  setOpen: Dispatch<boolean>;
  currentStep: CreateCalibrationStep;
  setCurrentStep: Dispatch<CreateCalibrationStep>;
  onBackFromFirstStep?: () => void;
}

const CreateCalibrationForm = ({
  setOpen,
  currentStep,
  setCurrentStep,
  onBackFromFirstStep,
}: CreateCalibrationFormProps) => {
  const navigate = useNavigate();
  const { mutate: createCalibrationMutate } = useCreateCalibration({
    onSuccess: ({ id }, { name }) => {
      toast.success(`${name} a bien été créée.`);
      setOpen(false);
      navigate({ to: `/acquisitions/${id}` });
    },
  });

  const form = useForm<CreateCalibrationPayload>({
    resolver: vineResolver(createCalibrationSchema),
    defaultValues: {
      name: '',
      scenarioId: null,
      withManualPoses: false,
      withPoseAutofocus: false,
    },
  });

  return (
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
          <SelectAcquisitionName
            isCalibration={true}
            onBack={onBackFromFirstStep}
            setOpen={setOpen}
            setCurrentStep={setCurrentStep}
          />
        ) : (
          <SelectAcquisitionScenario
            isCalibration={true}
            setCurrentStep={setCurrentStep as Dispatch<CreateAcquisitionStep>}
            setOpen={setOpen}
          />
        )}
      </form>
    </Form>
  );
};

export default CreateCalibrationForm;
