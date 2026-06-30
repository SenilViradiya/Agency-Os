'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function PortalRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/portal/auth">
      <PortalLayout>{children}</PortalLayout>
    </SessionProvider>
  );
}
export const dynamic = 'force-dynamic';
