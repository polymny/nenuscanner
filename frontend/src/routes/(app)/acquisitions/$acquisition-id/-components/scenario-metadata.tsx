import { Hourglass, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LedValue } from '@/types/led.types';
import { getLedValueLabel } from '@/types/led.types';
import { ScenarioLedIcon } from '@/components/scenario/scenario-led-icon';
import { cn, formatNumberAsFractionOrDecimal } from '@/lib/utils';

interface MetadataRowProps {
  icon: ReactNode;
  title: string;
  progress?: string;
  value: ReactNode;
  detail?: ReactNode;
  muted?: boolean;
}

function MetadataRow({ icon, title, progress, value, detail, muted = false }: MetadataRowProps) {
  return (
    <div className="flex items-center gap-2" title={title}>
      {icon}
      <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
        {progress && <span className="shrink-0 font-semibold text-gray-900 tabular-nums">{progress}</span>}
        <span className={cn('truncate', muted ? 'text-gray-500' : 'font-medium text-gray-800')}>{value}</span>
        {detail && <span className="shrink-0 text-gray-500 tabular-nums">{detail}</span>}
      </div>
    </div>
  );
}

const step = (index?: number, total?: number) =>
  index !== undefined && total !== undefined ? `${index}/${total}` : undefined;

interface ScenarioMetadataProps {
  rotation?: {
    index: number;
    total: number;
  };
  led?: {
    index?: number;
    total?: number;
    value: LedValue | null;
    power: number | null;
  };
  shutter?: {
    index?: number;
    total?: number;
    relative: number | null;
  };
  showProgress?: boolean;
  className?: string;
}

export default function ScenarioMetadata({
  rotation,
  led,
  shutter,
  showProgress = false,
  className,
}: ScenarioMetadataProps) {
  const ledPower =
    led?.value && led.value !== 'NO_LED' && led.power !== null ? `${Math.round(led.power * 100)} %` : undefined;

  const hasMultipleRotations = (rotation?.total ?? 1) > 1;
  const rotationValue = hasMultipleRotations
    ? `Rotation ${rotation?.index ?? 0}/${rotation?.total ?? 0}`
    : 'Sans rotation';

  return (
    <div className={cn('flex flex-col gap-1.5 text-xs', className)}>
      {rotation && (
        <MetadataRow
          icon={<RotateCw className="size-4 shrink-0 text-violet-600" />}
          title="Rotation"
          progress={showProgress && hasMultipleRotations ? step(rotation.index, rotation.total) : undefined}
          value={rotationValue}
          muted={!hasMultipleRotations}
        />
      )}
      {led && (
        <MetadataRow
          icon={<ScenarioLedIcon ledValue={led.value} />}
          title="LED"
          progress={showProgress ? step(led.index, led.total) : undefined}
          value={led.value ? getLedValueLabel(led.value) : '—'}
          detail={ledPower}
          muted={!led.value}
        />
      )}
      {shutter && (
        <MetadataRow
          icon={<Hourglass className="size-4 shrink-0 text-cyan-600" />}
          title="Temps d'exposition"
          progress={showProgress ? step(shutter.index, shutter.total) : undefined}
          value={shutter.relative !== null ? `×${formatNumberAsFractionOrDecimal(shutter.relative)}` : '—'}
          muted={shutter.relative === null}
        />
      )}
    </div>
  );
}
