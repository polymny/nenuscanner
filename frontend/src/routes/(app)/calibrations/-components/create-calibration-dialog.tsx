import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';
import type { CreateCalibrationStep } from '@/components/acquisition/create-acquisition-form/create-acquisition.types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateCalibrationForm from '@/components/acquisition/create-acquisition-form/create-calibration-form';

interface CreateCalibrationDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
}

const CreateCalibrationDialog = ({ open, setOpen }: CreateCalibrationDialogProps) => {
  const [currentStep, setCurrentStep] = useState<CreateCalibrationStep>('name');

  useEffect(() => {
    if (open) {
      setCurrentStep('name');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <CreateCalibrationForm setOpen={setOpen} currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateCalibrationDialog;
