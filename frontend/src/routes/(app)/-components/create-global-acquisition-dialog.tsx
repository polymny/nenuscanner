import { useEffect, useState } from 'react';
import type {
  CreateAcquisitionStep,
  CreateCalibrationStep,
  CreateGlobalAcquisitionState,
} from '@/components/acquisition/create-acquisition-form/create-acquisition.types';
import CreateAcquisitionForm from '@/components/acquisition/create-acquisition-form/create-acquisition-form';
import CreateCalibrationForm from '@/components/acquisition/create-acquisition-form/create-calibration-form';
import SelectAcquisitionArtifact from '@/components/acquisition/create-acquisition-form/select-acquisition-artifact';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import SelectAcquisitionKind from '@/components/acquisition/create-acquisition-form/select-acquisition-kind';
import { Button } from '@/components/ui/button';

const initialState = { step: 'kind', kind: null } satisfies CreateGlobalAcquisitionState;

const CreateGlobalAcquisitionDialog = () => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CreateGlobalAcquisitionState>(initialState);

  useEffect(() => {
    if (open) {
      setState(initialState);
    }
  }, [open]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          size="sm"
          variant="outline"
        >
          Créer une acquisition
        </Button>
      </DialogTrigger>
      <DialogContent>
        {state.step === 'kind' && (
          <SelectAcquisitionKind
            setOpen={setOpen}
            onContinue={(kind) => {
              setState(
                kind === 'object' ? { step: 'artifact', kind: 'object' } : { step: 'name', kind: 'calibration' }
              );
            }}
          />
        )}
        {state.step === 'artifact' && (
          <SelectAcquisitionArtifact
            setOpen={setOpen}
            onBack={() => {
              setState({ step: 'kind', kind: null });
            }}
            onContinue={(artifactId) => {
              setState({ step: 'name', kind: 'object', artifactId });
            }}
          />
        )}
        {state.kind === 'object' && 'artifactId' in state && (
          <CreateAcquisitionForm
            key={state.artifactId}
            artifactId={state.artifactId}
            currentStep={state.step}
            onBackFromFirstStep={() => {
              setState({ step: 'artifact', kind: 'object' });
            }}
            setCurrentStep={(step: CreateAcquisitionStep) => {
              setState((current) =>
                current.kind === 'object' && 'artifactId' in current ? { ...current, step } : current
              );
            }}
            setOpen={setOpen}
          />
        )}
        {state.kind === 'calibration' && (
          <CreateCalibrationForm
            currentStep={state.step}
            onBackFromFirstStep={() => {
              setState({ step: 'kind', kind: null });
            }}
            setCurrentStep={(step: CreateCalibrationStep) => {
              setState((current) => (current.kind === 'calibration' ? { ...current, step } : current));
            }}
            setOpen={setOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateGlobalAcquisitionDialog;
