import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import ProfilesTable from './-components/profiles-table';
import UpsertProfileDialog from './-components/upsert-profile-dialog';
import { useDeleteProfile } from '@/api/mutations/profile.mutations';
import { useGetProfiles } from '@/api/queries/profile.queries';
import { Button } from '@/components/ui/button';
import ConfirmActionDialog from '@/components/confirm-action-dialog';

export const Route = createFileRoute('/(app)/profiles/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: profiles, isPending: isLoadingProfiles } = useGetProfiles();
  const [upsertMode, setUpsertMode] = useState<'create' | 'update'>('create');
  const [openUpsertDialog, setOpenUpsertDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const { mutate: deleteProfile } = useDeleteProfile({
    onSuccess: () => {
      toast.success('Profil supprimé.');
    },
    onError: () => {
      toast.error('La suppression a échoué.');
    },
  });

  const handleEdit = useCallback((profileId: number) => {
    setSelectedProfileId(profileId);
    setUpsertMode('update');
    setOpenUpsertDialog(true);
  }, []);

  const handleDelete = useCallback((profileId: number) => {
    setSelectedProfileId(profileId);
    setOpenDeleteDialog(true);
  }, []);

  const openCreateDialog = useCallback(() => {
    setUpsertMode('create');
    setSelectedProfileId(null);
    setOpenUpsertDialog(true);
  }, []);

  return (
    <div className="bg-gray-25 flex h-full flex-col items-center gap-6 px-20 py-8">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-950">Profils</h2>
          <Button type="button" onClick={openCreateDialog}>
            Créer un profil
          </Button>
        </div>

        <ProfilesTable
          isLoading={isLoadingProfiles}
          onDelete={handleDelete}
          onEdit={handleEdit}
          profiles={profiles ?? []}
        />
      </div>

      <UpsertProfileDialog
        mode={upsertMode}
        open={openUpsertDialog}
        profileId={selectedProfileId ?? undefined}
        setOpen={setOpenUpsertDialog}
      />
      <ConfirmActionDialog
        confirmButtonContent="Supprimer"
        confirmButtonVariant={{ variant: 'destructive' }}
        description="Voulez-vous vraiment supprimer ce profil ? Cette action ne peut pas être annulée."
        handleConfirmAction={() => {
          if (selectedProfileId) deleteProfile(selectedProfileId);
        }}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        title="Supprimer le profil"
      />
    </div>
  );
}
