import { createFileRoute } from '@tanstack/react-router';
import { DefaultContent } from '@/components/default-content';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  return <DefaultContent />;
}
