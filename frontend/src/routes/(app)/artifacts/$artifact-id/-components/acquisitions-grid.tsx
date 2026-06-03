import { memo } from 'react';
import type { Acquisition } from '@/types/acquisition.types';
import AcquisitionCard from '@/components/acquisition/acquisition-card';

interface AcquisitionsGridProps {
  acquisitions: Array<Acquisition>;
  onNavigate: (acquisitionId: number) => void;
  onDelete: (acquisitionId: number) => void;
  onDownloadAcquisition?: (acquisitionId: number) => void;
  onSelectAcquisition?: (acquisitionId: number, selected: boolean) => void;
  multiSelectedAcquisitionIds?: Array<number>;
}

const AcquisitionsGrid = memo(function AcquisitionsGrid({
  acquisitions,
  onNavigate,
  onDelete,
  onDownloadAcquisition,
  onSelectAcquisition,
  multiSelectedAcquisitionIds = [],
}: AcquisitionsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-5">
      {acquisitions.map((acquisition) => (
        <AcquisitionCard
          acquisition={acquisition}
          key={acquisition.id}
          onClick={() => onNavigate(acquisition.id)}
          onDelete={() => onDelete(acquisition.id)}
          onDownload={
            acquisition.status === 'COMPLETED' && onDownloadAcquisition
              ? () => onDownloadAcquisition(acquisition.id)
              : undefined
          }
          onSelect={
            acquisition.status === 'COMPLETED' && onSelectAcquisition
              ? (selected) => onSelectAcquisition(acquisition.id, selected)
              : undefined
          }
          selected={multiSelectedAcquisitionIds.includes(acquisition.id)}
        />
      ))}
    </div>
  );
});

export default AcquisitionsGrid;
