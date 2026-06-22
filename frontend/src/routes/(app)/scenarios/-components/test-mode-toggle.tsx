import { Cctv } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestModeToggleProps {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const TestModeToggle = ({ active, disabled = false, onToggle }: TestModeToggleProps) => (
  <button
    aria-pressed={active}
    className={cn(
      'focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      active
        ? 'border-warning-500 bg-warning-500 text-white shadow-sm hover:bg-warning-600'
        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800'
    )}
    disabled={disabled}
    type="button"
    onClick={onToggle}
  >
    <Cctv aria-hidden className="size-3.5 shrink-0" />
    Mode test
  </button>
);

export default TestModeToggle;
