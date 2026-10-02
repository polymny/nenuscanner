import ScenarioMetadata from './scenario-metadata';
import type { ScenarioProgressEvent } from '@/types/acquisition.types';

interface ScenarioProgressWidgetProps {
  progress: ScenarioProgressEvent;
}

export default function ScenarioProgressWidget({ progress }: ScenarioProgressWidgetProps) {
  return (
    <div className="absolute top-4 right-4 z-10 max-w-xs min-w-[300px] rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-md">
      <p className="mb-3 font-medium text-gray-900">
        Photo {progress.step} / {progress.total}
      </p>
      <ScenarioMetadata
        showProgress
        pose={{
          index: progress.poseIndex,
          total: progress.poseTotal,
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
