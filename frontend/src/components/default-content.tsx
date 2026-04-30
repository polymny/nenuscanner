import { toast } from 'sonner';
import { Button } from './ui/button';
import { useGetTestQuery } from '@/api/queries/test.queries';

export const DefaultContent = () => {
  const { refetch, isFetching } = useGetTestQuery({ enabled: false });

  const onFetchApi = async () => {
    const toastId = toast.loading('Fetch API…');

    try {
      const result = await refetch();
      if (!result.data) throw new Error('Réponse vide');

      if (!('status' in result.data)) {
        toast.success(`Object2: ${result.data.id} — ${result.data.name}`, {
          id: toastId,
        });
        return;
      }

      toast.error(`Erreur: ${result.data.message}`, { id: toastId });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      toast.error(`Erreur: ${message}`, { id: toastId });
    }
  };

  return (
    <div>
      <Button type="button" onClick={onFetchApi} disabled={isFetching}>
        Fetch API
      </Button>
    </div>
  );
};
