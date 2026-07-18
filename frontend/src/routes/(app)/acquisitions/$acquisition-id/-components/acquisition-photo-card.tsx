import ScenarioMetadata from './scenario-metadata';
import type { AcquisitionPhoto } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';

interface AcquisitionPhotoCardProps {
  photo: AcquisitionPhoto;
  poseTotal: number;
}

export default function AcquisitionPhotoCard({ photo, poseTotal }: AcquisitionPhotoCardProps) {
  return (
    <div className="flex h-[250px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div
        className="w-full flex-1 bg-origin-content p-5"
        style={{
          backgroundImage: `url(${toAbsoluteImageUrl(photo.imageUrl)})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'rgba(236, 240, 250, 1)',
        }}
      />
      <div className="border-t border-gray-100 p-3">
        <ScenarioMetadata
          pose={{
            index: photo.poseIndex,
            total: poseTotal,
          }}
          led={{ value: photo.ledValue, power: photo.ledPower }}
          shutter={{ relative: photo.shutterSpeedRelative }}
        />
      </div>
    </div>
  );
}
