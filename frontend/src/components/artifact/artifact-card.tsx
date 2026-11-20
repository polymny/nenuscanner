import { Download, ImageOff, Pencil, Trash } from 'lucide-react';
import type { Artifact } from '@/types/artifact.types';
import type { CardMenuItem } from '@/components/selectable-card';
import SelectableCard, { CardThumbnail } from '@/components/selectable-card';
import { formatDateFr, formatSizeGb, pluralize } from '@/lib/utils';

interface ArtifactCardProps {
  artifact: Artifact;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export default function ArtifactCard({
  artifact,
  onOpen,
  onRename,
  onDelete,
  onDownload,
  onSelect,
  selected,
  selectionMode,
}: ArtifactCardProps) {
  const menuItems: Array<CardMenuItem> = [
    { label: 'Renommer', icon: Pencil, onClick: onRename },
    ...(onDownload ? [{ label: 'Télécharger', icon: Download, onClick: onDownload }] : []),
    { label: 'Supprimer', icon: Trash, onClick: onDelete, destructive: true },
  ];

  return (
    <SelectableCard
      menuItems={menuItems}
      name={artifact.name}
      onOpen={onOpen}
      onSelect={onSelect}
      selected={selected}
      selectionMode={selectionMode}
    >
      <CardThumbnail placeholder="Aucune acquisition" placeholderIcon={ImageOff} thumbnail={artifact.thumbnail}>
        {artifact.acquisitionsCount > 0 && (
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs text-gray-500">
            {artifact.lastAcquisitionAt && <span>{formatDateFr(artifact.lastAcquisitionAt)}</span>}
            <span aria-hidden className="font-bold">
              ·
            </span>
            <span>{formatSizeGb(artifact.sizeBytes)}</span>
            <span aria-hidden className="font-bold">
              ·
            </span>
            <span>
              {artifact.acquisitionsCount} {pluralize(artifact.acquisitionsCount, 'acquisition')}
            </span>
          </div>
        )}
      </CardThumbnail>
    </SelectableCard>
  );
}
