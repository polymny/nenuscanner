import { vineResolver } from '@hookform/resolvers/vine';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import type { Dispatch } from 'react';
import type { Scenario } from '@/types/scenario.types';
import type { CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import { createCalibrationSchema } from '@/schemas/acquisition.schemas';
import { useCreateCalibration } from '@/api/mutations/acquisition.mutations';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateScenarioCalibrationDialogProps {
  open: boolean;
  setOpen: Dispatch<boolean>;
  scenario: Scenario | null;
}

export default function CreateScenarioCalibrationDialog({
  open,
  setOpen,
  scenario,
}: CreateScenarioCalibrationDialogProps) {
  const hasMultipleRotations = (scenario?.rotationsCount ?? 1) > 1;
  const navigate = useNavigate();
  const { isPending, mutate: createCalibrationMutate } = useCreateCalibration({
    onSuccess: ({ id }, { name }) => {
      toast.success(`${name} a bien été créée.`);
      setOpen(false);
      void navigate({ to: `/acquisitions/${id}` });
    },
  });

  const form = useForm<CreateCalibrationPayload>({
    resolver: vineResolver(createCalibrationSchema),
    defaultValues: {
      name: '',
      scenarioId: scenario?.id ?? null,
      withManualRotations: false,
      withRotationAutofocus: false,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: '',
      scenarioId: scenario?.id ?? null,
      withManualRotations: false,
      withRotationAutofocus: false,
    });
  }, [form, open, scenario]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              void form.handleSubmit((payload) => {
                createCalibrationMutate(payload);
              })(event);
            }}
          >
            <DialogHeader>
              <DialogTitle>Créer un étalonnage</DialogTitle>
              <DialogDescription>Veuillez entrer un nom pour ce nouvel étalonnage.</DialogDescription>
            </DialogHeader>
            <div className="bg-gray-25 flex flex-col gap-3 p-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input {...field} placeholder="Nom" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={form.control}
                name="withManualRotations"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-row items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        className="data-[state=checked]:bg-success-500"
                        disabled={!hasMultipleRotations}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <span className="text-sm font-medium text-gray-700">
                      Je souhaite effectuer les rotations manuellement
                    </span>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="withRotationAutofocus"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-row items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        className="data-[state=checked]:bg-success-500"
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <span className="text-sm font-medium text-gray-700">
                      Je souhaite faire l&apos;autofocus pour chaque pose de l&apos;objet
                    </span>
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
              <Button disabled={!form.watch('name') || isPending} size="lg" type="submit">
                Créer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
