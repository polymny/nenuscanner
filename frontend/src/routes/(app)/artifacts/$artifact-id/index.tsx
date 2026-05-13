import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import ConfigureAcquisitionDialog from '../-components/configure-acquisition/configure-acquisition-dialog';
import { useGetArtifacts } from '@/api/queries/artifact.queries';
import CustomBreadcrumb from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/(app)/artifacts/$artifact-id/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'artifact-id': artifactId } = Route.useParams();
  const navigate = useNavigate();
  const { data: artifacts, isPending: isLoadingArtifacts } = useGetArtifacts();
  const existingArtifact = useMemo(
    () => artifacts?.find((artifact) => artifact.id === Number(artifactId)),
    [artifacts, artifactId]
  );

  const [configureAcquisitionOpen, setConfigureAcquisitionOpen] = useState(false);

  if (!isLoadingArtifacts && !existingArtifact) {
    navigate({ to: '/artifacts' });
    return null;
  }

  if (!existingArtifact) return <></>;

  return (
    <div className="bg-gray-25 flex h-full flex-col items-start gap-6 px-20 py-8">
      <CustomBreadcrumb
        backPageName="Revenir aux objets"
        backPagePath="/artifacts"
        currentPageName={existingArtifact.name}
      />
      <h1>{`Acquisitions de ${existingArtifact.name}`}</h1>
      <div className="flex h-full w-full justify-center">
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="size-max rounded-full border border-gray-200 bg-white p-3">
            <Camera className="text-brand-600 size-6" />
          </div>
          <h4 className="font-semibold">Aucune acquisition trouvée</h4>
          <Button onClick={() => setConfigureAcquisitionOpen(true)}>Créer une acquisition</Button>
        </div>
      </div>
      <ConfigureAcquisitionDialog open={configureAcquisitionOpen} setOpen={setConfigureAcquisitionOpen} />
    </div>
  );
}
