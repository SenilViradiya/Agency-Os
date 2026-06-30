'use client';

import { useParams } from 'next/navigation';
import PortalInvoiceDetail from '@/components/portal/PortalInvoiceDetail';

export default function PortalInvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return <PortalInvoiceDetail id={id} />;
}
export const dynamic = 'force-dynamic';
