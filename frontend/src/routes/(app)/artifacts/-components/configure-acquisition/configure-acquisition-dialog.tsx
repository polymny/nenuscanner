import { useEffect, useState } from 'react';
import SelectAcquisitionScenario from './select-acquisition-scenario';
import SelectAcquisitionCalibration from './select-acquisition-calibration';
import type { Dispatch } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export type ConfigureAcquisitionStep = 'scenario' | 'calibration';

interface ConfigureAcquisitionDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
}

const ConfigureAcquisitionDialog = ({ open, setOpen }: ConfigureAcquisitionDialogProps) => {
  const [currentStep, setCurrentStep] = useState<ConfigureAcquisitionStep>('scenario');
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [withRotationAutofocus, setWithRotationAutofocus] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setCurrentStep('scenario');
      setSelectedScenarioId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {currentStep === 'scenario' ? (
          <SelectAcquisitionScenario
            setWithRotationAutofocus={setWithRotationAutofocus}
            withRotationAutofocus={withRotationAutofocus}
            setOpen={setOpen}
            setCurrentStep={setCurrentStep}
            setSelectedScenarioId={setSelectedScenarioId}
            selectedScenarioId={selectedScenarioId}
          />
        ) : (
          <SelectAcquisitionCalibration setOpen={setOpen} setCurrentStep={setCurrentStep} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureAcquisitionDialog;
