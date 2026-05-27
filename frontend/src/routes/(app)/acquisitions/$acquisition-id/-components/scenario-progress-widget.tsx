import type { ScenarioProgressEvent } from '@/types/acquisition.types';
import type { LedValue } from '@/types/led.types';
import { getLedValueLabel } from '@/types/led.types';

interface ScenarioProgressWidgetProps {
  progress: ScenarioProgressEvent;
}

export default function ScenarioProgressWidget({ progress }: ScenarioProgressWidgetProps) {
  const ledLabel =
    progress.ledValue &&
    (progress.ledValue === 'ALL_LEDS' || progress.ledValue === 'NO_LED' || /^\d+$/.test(progress.ledValue))
      ? getLedValueLabel(progress.ledValue as LedValue)
      : progress.ledValue;

  return (
    <div className="absolute top-4 right-4 z-10 max-w-xs min-w-[300px] rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-md">
      <p className="mb-2 font-medium text-gray-900">
        Photo {progress.step} / {progress.total}
      </p>
      {progress.hasRotations ? (
        <p className="text-gray-600">
          Rotation {progress.rotationIndex} / {progress.rotationTotal}
          {progress.rotationRadians !== null && (
            <span className="text-gray-500"> ({progress.rotationRadians.toFixed(2)} rad)</span>
          )}
        </p>
      ) : (
        <p className="text-gray-600">Sans rotation</p>
      )}
      <p className="text-gray-600">
        LED {progress.ledIndex} / {progress.ledTotal} — {ledLabel} ({Math.round(progress.ledPower * 100)} %)
      </p>
      <p className="text-gray-600">
        Temps d'exposition {progress.shutterSpeedIndex} / {progress.shutterSpeedTotal} — x
        {progress.shutterSpeedRelative}
      </p>
    </div>
  );
}
