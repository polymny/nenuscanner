import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';
import type { CreateAcquisitionStep } from '@/components/acquisition/create-acquisition-form/create-acquisition.types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateAcquisitionForm from '@/components/acquisition/create-acquisition-form/create-acquisition-form';

interface CreateAcquisitionDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  artifactId: number;
}

const CreateAcquisitionDialog = ({ open, setOpen, artifactId }: CreateAcquisitionDialogProps) => {
  const [currentStep, setCurrentStep] = useState<CreateAcquisitionStep>('name');

  useEffect(() => {
    if (open) {
      setCurrentStep('name');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <CreateAcquisitionForm
          setOpen={setOpen}
          artifactId={artifactId}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateAcquisitionDialog;
