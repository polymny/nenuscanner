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

      if (result.data.status === 'ok') {
        toast.success(`Object2: ${result.data.object2.id} — ${result.data.object2.name}`, { id: toastId });
        return;
      }

      const message = result.data.message ?? result.data.details ?? result.data.error;
      toast.error(`Erreur: ${message}`, { id: toastId });
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
