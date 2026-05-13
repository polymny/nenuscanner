import { ArrowLeft } from 'lucide-react';

import { Button } from './button';
import type { ComponentProps } from 'react';

const DialogBackButton = (props: ComponentProps<'button'>) => {
  return (
    <Button className="self-start" type="button" variant="link" {...props}>
      <ArrowLeft className="text-brand-600" size={16} />
      Retour
    </Button>
  );
};

export default DialogBackButton;
