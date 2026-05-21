import { memo, useMemo } from 'react';
import { CheckCircle, Pen, Trash2, XCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Profile } from '@/types/profile.types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

const formatOptionalCell = (value: string | null) => value ?? '—';

interface ProfilesTableProps {
  profiles: Array<Profile>;
  isLoading: boolean;
  onEdit: (profileId: number) => void;
  onDelete: (profileId: number) => void;
}

const ProfilesTable = memo(function ProfilesTable({ profiles, isLoading, onEdit, onDelete }: ProfilesTableProps) {
  const columns = useMemo<Array<ColumnDef<Profile>>>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nom',
      },
      {
        accessorKey: 'ownerName',
        header: 'Responsable',
        cell: ({ row }) => formatOptionalCell(row.original.ownerName),
      },
      {
        accessorKey: 'employer',
        header: 'Employeur',
        cell: ({ row }) => formatOptionalCell(row.original.employer),
      },
      {
        accessorKey: 'contact',
        header: 'Contact',
        cell: ({ row }) => formatOptionalCell(row.original.contact),
      },
      {
        accessorKey: 'project',
        header: 'Projet',
        cell: ({ row }) => formatOptionalCell(row.original.project),
      },
      {
        accessorKey: 'isActive',
        header: 'Actif',
        cell: ({ row }) =>
          row.original.isActive ? (
            <CheckCircle className="size-5 text-green-700" />
          ) : (
            <XCircle className="size-5 text-red-700" />
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              aria-label={`Modifier ${row.original.name}`}
              onClick={() => {
                onEdit(row.original.id);
              }}
              type="button"
              variant="link"
            >
              <Pen className="size-5 text-gray-700" />
            </Button>
            <Button
              aria-label={`Supprimer ${row.original.name}`}
              onClick={() => {
                onDelete(row.original.id);
              }}
              type="button"
              variant="link"
            >
              <Trash2 className="text-error-700 size-5" />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit]
  );

  return <DataTable columns={columns} data={profiles} emptyMessage="Aucun profil." isLoading={isLoading} />;
});

export default ProfilesTable;
