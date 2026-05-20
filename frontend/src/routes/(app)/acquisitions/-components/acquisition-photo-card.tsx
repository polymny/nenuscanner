import type { AcquisitionPhoto } from '@/types/acquisition.types';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';
import { getLedValueLabel } from '@/types/led.types';

interface AcquisitionPhotoCardProps {
  photo: AcquisitionPhoto;
}

export default function AcquisitionPhotoCard({ photo }: AcquisitionPhotoCardProps) {
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
      ></div>
      <div className="flex flex-col gap-1 p-3 text-xs text-gray-600">
        {photo.rotationRadians !== null ? (
          <p>Rotation : {photo.rotationRadians.toFixed(2)} rad</p>
        ) : (
          <p>Rotation : —</p>
        )}
        <p>
          LED : {photo.ledValue ? getLedValueLabel(photo.ledValue) : '—'}
          {photo.ledPower ? ` (${Math.round(photo.ledPower * 100)} %)` : '—'}
        </p>
        <p>Temps d'exposition : {photo.shutterSpeedRelative ? `${'\u00d7'}${photo.shutterSpeedRelative}` : '—'}</p>
      </div>
    </div>
  );
}
