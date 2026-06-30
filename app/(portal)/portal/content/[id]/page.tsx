'use client';

import { useParams } from 'next/navigation';
import PortalContentDetail from '@/components/portal/PortalContentDetail';

export default function PortalContentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return <PortalContentDetail id={id} />;
}
export const dynamic = 'force-dynamic';
