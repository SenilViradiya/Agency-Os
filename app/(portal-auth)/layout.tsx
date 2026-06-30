'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { App as AntdApp } from 'antd';

export default function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/portal/auth">
      <AntdApp>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F4F6F9',
          padding: '20px'
        }}>
          {children}
        </div>
      </AntdApp>
    </SessionProvider>
  );
}
export const dynamic = 'force-dynamic';
