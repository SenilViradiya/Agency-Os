'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import { SessionProvider } from 'next-auth/react';
import antdTheme from '@/theme/antdTheme';

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <AntdRegistry>
                <ConfigProvider theme={antdTheme}>
                    <App>
                        {children}
                    </App>
                </ConfigProvider>
            </AntdRegistry>
        </SessionProvider>
    );
}
