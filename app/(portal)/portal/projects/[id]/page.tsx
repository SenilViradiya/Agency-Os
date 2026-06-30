'use client';

import { useParams } from 'next/navigation';
import PortalProjectDetail from '@/components/portal/PortalProjectDetail';

export default function PortalProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return <PortalProjectDetail id={id} />;
}
export const dynamic = 'force-dynamic';
