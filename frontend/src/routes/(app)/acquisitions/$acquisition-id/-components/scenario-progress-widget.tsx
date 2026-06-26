import ScenarioMetadata from './scenario-metadata';
import type { ScenarioProgressEvent } from '@/types/acquisition.types';

interface ScenarioProgressWidgetProps {
  progress: ScenarioProgressEvent;
  manualRotations?: boolean;
}

export default function ScenarioProgressWidget({ progress, manualRotations = false }: ScenarioProgressWidgetProps) {
  return (
    <div className="absolute top-4 right-4 z-10 max-w-xs min-w-[300px] rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-md">
      <p className="mb-3 font-medium text-gray-900">
        Photo {progress.step} / {progress.total}
      </p>
      <ScenarioMetadata
        showProgress
        manualRotations={manualRotations}
        rotation={{
          index: progress.rotationIndex,
          total: progress.rotationTotal,
          radians: progress.rotationRadians,
          hasRotations: progress.hasRotations,
        }}
        led={{
          index: progress.ledIndex,
          total: progress.ledTotal,
          value: progress.ledValue,
          power: progress.ledPower,
        }}
        shutter={{
          index: progress.shutterSpeedIndex,
          total: progress.shutterSpeedTotal,
          relative: progress.shutterSpeedRelative,
        }}
      />
    </div>
  );
}
