import { memo } from 'react';
import type { Acquisition } from '@/types/acquisition.types';
import AcquisitionCard from '@/components/acquisition/acquisition-card';

interface AcquisitionsGridProps {
  acquisitions: Array<Acquisition>;
  onNavigate: (acquisitionId: number) => void;
  onDelete: (acquisitionId: number) => void;
}

const AcquisitionsGrid = memo(function AcquisitionsGrid({
  acquisitions,
  onNavigate,
  onDelete,
}: AcquisitionsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-5">
      {acquisitions.map((acquisition) => (
        <AcquisitionCard
          acquisition={acquisition}
          key={acquisition.id}
          onClick={() => onNavigate(acquisition.id)}
          onDelete={() => onDelete(acquisition.id)}
        />
      ))}
    </div>
  );
});

export default AcquisitionsGrid;
