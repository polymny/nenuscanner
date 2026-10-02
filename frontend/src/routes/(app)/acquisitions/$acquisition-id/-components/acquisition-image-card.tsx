import ScenarioMetadata from './scenario-metadata';
import type { AcquisitionImage } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';

interface AcquisitionImageCardProps {
  image: AcquisitionImage;
  poseTotal: number;
}

export default function AcquisitionImageCard({ image, poseTotal }: AcquisitionImageCardProps) {
  return (
    <div className="flex h-[250px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div
        className="w-full flex-1 bg-origin-content p-5"
        style={{
          backgroundImage: `url(${toAbsoluteImageUrl(image.imageUrl)})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'rgba(236, 240, 250, 1)',
        }}
      />
      <div className="border-t border-gray-100 p-3">
        <ScenarioMetadata
          pose={{
            index: image.poseIndex,
            total: poseTotal,
          }}
          led={{ value: image.ledValue, power: image.ledPower }}
          shutter={{ relative: image.shutterSpeedRelative }}
        />
      </div>
    </div>
  );
}
