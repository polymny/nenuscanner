import { vineResolver } from '@hookform/resolvers/vine';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Dispatch } from 'react';
import type { UpsertProfilePayload } from '@/schemas/profile.schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpsertProfile } from '@/api/mutations/profile.mutations';
import { upsertProfileSchema } from '@/schemas/profile.schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetProfiles } from '@/api/queries/profile.queries';

interface UpsertProfileDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  profileId?: number;
  mode: 'create' | 'update';
}

const UpsertProfileDialog = ({ open, setOpen, profileId, mode }: UpsertProfileDialogProps) => {
  const { data: profiles } = useGetProfiles();
  const existingProfile = useMemo(() => profiles?.find((profile) => profile.id === profileId), [profiles, profileId]);

  const { isPending: isUpsertingProfile, mutate: upsertProfileMutate } = useUpsertProfile(mode, {
    onSuccess: (_, { name }) => {
      setOpen(false);
      toast.success(`${name} a bien été ${mode === 'create' ? 'créé' : 'modifié'}.`);
      setTimeout(() => {
        form.reset();
      }, 1000);
    },
  });

  const form = useForm<UpsertProfilePayload>({
    resolver: vineResolver(upsertProfileSchema),
    values: {
      name: existingProfile?.name ?? '',
      id: mode === 'create' ? undefined : existingProfile?.id,
      ownerName: existingProfile?.ownerName ?? null,
      employer: existingProfile?.employer ?? null,
      contact: existingProfile?.contact ?? null,
      project: existingProfile?.project ?? null,
      isActive: existingProfile?.isActive ?? false,
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((payload) => {
              upsertProfileMutate(payload);
            })}
            className="flex flex-col"
          >
            <DialogHeader>
              <DialogTitle>{mode === 'create' ? 'Créer un profil' : 'Modifier le profil'}</DialogTitle>
              <DialogDescription>
                {mode === 'create'
                  ? 'Renseignez les informations du nouveau profil.'
                  : 'Modifiez les informations du profil.'}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-25 flex flex-col gap-3 p-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du profil" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Responsable</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du responsable" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employer"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Employeur</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Employeur" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contact" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Projet</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Projet" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="items-center justify-between">
              <Button
                onClick={() => {
                  setOpen(false);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
              <Button disabled={!form.watch('name') || isUpsertingProfile} size="lg" type="submit">
                Valider
                {isUpsertingProfile && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertProfileDialog;
