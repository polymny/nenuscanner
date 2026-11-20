import ScenarioMetadata from './scenario-metadata';
import type { AcquisitionImage } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';

interface AcquisitionImageCardProps {
  image: AcquisitionImage;
  poseTotal: number;
}

export default function AcquisitionImageCard({ image, poseTotal }: AcquisitionImageCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Camera previews are 3:2: the image spans the whole card width, contain only matters for other ratios. */}
      <img
        alt=""
        className="bg-brand-50 aspect-[3/2] w-full object-contain"
        loading="lazy"
        src={toAbsoluteImageUrl(image.imageUrl)}
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
