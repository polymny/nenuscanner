import { Cctv } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectModeToggleProps {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const InspectModeToggle = ({ active, disabled = false, onToggle }: InspectModeToggleProps) => (
  <button
    aria-pressed={active}
    className={cn(
      'focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      active
        ? 'border-warning-500 bg-warning-500 hover:bg-warning-600 text-white shadow-sm'
        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800'
    )}
    disabled={disabled}
    type="button"
    onClick={onToggle}
  >
    <Cctv aria-hidden className="size-3.5 shrink-0" />
    Inspecter
  </button>
);

export default InspectModeToggle;
