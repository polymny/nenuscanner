import { Link } from '@tanstack/react-router';
import { ArrowLeft, Slash } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './breadcrumb';

interface CustomBreadcrumbProps {
  backPageName: string;
  backPagePath: string;
  currentPageName: string;
}

const CustomBreadcrumb = ({ backPageName, backPagePath, currentPageName }: CustomBreadcrumbProps) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link className="text-brand-800 flex items-center gap-1" to={backPagePath}>
              <ArrowLeft className="text-brand-400" size={16} />
              {backPageName}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash color="#E2E8F0" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>{currentPageName}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;
