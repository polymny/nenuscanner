import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateAcquisitionCardProps {
  label: string;
  description?: string;
  onClick: () => void;
  className?: string;
}

export default function CreateAcquisitionCard({ label, description, onClick, className }: CreateAcquisitionCardProps) {
  return (
    <button
      className={cn(
        'group hover:bg-brand-100 focus-visible:ring-brand-600 flex w-full flex-col gap-1 rounded-lg border border-transparent p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
      onClick={onClick}
      type="button"
    >
      <div className="px-2">
        <div className="text-brand-600 truncate text-lg font-semibold">{label}</div>
      </div>
      <div className="group-hover:border-brand-400 group-hover:bg-brand-50 flex h-[200px] w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 transition-colors">
        <div className="group-hover:border-brand-200 rounded-full border border-gray-200 bg-white p-4 transition-colors">
          <Plus className="text-brand-600 size-10" />
        </div>
      </div>
      {description && <p className="px-2 text-sm text-gray-500">{description}</p>}
    </button>
  );
}
