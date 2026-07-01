import { Hourglass, RotateCw } from 'lucide-react';
import type { ScenarioCompatibility } from '@/types/scenario.types';
import { ScenarioLedIcon } from '@/components/scenario/scenario-led-icon';
import { cn } from '@/lib/utils';

interface ScenarioCompatibilityIndicatorsProps {
  compatibility: Omit<ScenarioCompatibility, 'id'>;
  className?: string;
}

interface CompatibilityIndicatorProps {
  matches: boolean;
  title: string;
  children: React.ReactNode;
}

function CompatibilityIndicator({ matches, title, children }: CompatibilityIndicatorProps) {
  return (
    <span
      className={cn(
        'flex size-4.5 items-center justify-center rounded-full',
        matches ? 'bg-success-300 [&_svg]:text-success-700!' : 'bg-gray-100 [&_svg]:text-gray-400!'
      )}
      title={title}
    >
      <span className="[&_svg]:size-2.5">{children}</span>
    </span>
  );
}

export default function ScenarioCompatibilityIndicators({
  compatibility,
  className,
}: ScenarioCompatibilityIndicatorsProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <CompatibilityIndicator matches={compatibility.sameLedPowerValues} title="Mêmes puissances de LED">
        <ScenarioLedIcon ledValue="1" />
      </CompatibilityIndicator>
      <CompatibilityIndicator matches={compatibility.sameShutterSpeeds} title="Mêmes temps de pose">
        <Hourglass className="size-4" />
      </CompatibilityIndicator>
      <CompatibilityIndicator matches={compatibility.sameRotationsCount} title="Même nombre de rotations">
        <RotateCw className="size-4" />
      </CompatibilityIndicator>
    </div>
  );
}
