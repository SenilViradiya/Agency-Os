'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Spin, App as AntdApp } from 'antd';
import { PortalProvider, usePortal } from './PortalContext';
import PortalSidebar from './PortalSidebar';
import PortalTopbar from './PortalTopbar';

const { Content } = Layout;

function PortalLayoutContent({ children }: { children: React.ReactNode }) {
    const { loading } = usePortal();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4F6F9' }}>
                <Spin size="large" tip="Loading Client Portal..." />
            </div>
        );
    }

    return (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
            <PortalSidebar collapsed={collapsed} onCollapse={setCollapsed} isMobile={isMobile} />
            <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <PortalTopbar collapsed={collapsed} onToggle={toggleCollapsed} />
                <Content style={{ 
                    padding: isMobile ? '16px' : '24px 32px',
                    margin: 0,
                    flex: 1,
                    overflowY: 'auto',
                    transition: 'all 0.2s',
                    backgroundColor: '#F4F6F9'
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <PortalProvider>
            <AntdApp>
                <PortalLayoutContent>{children}</PortalLayoutContent>
            </AntdApp>
        </PortalProvider>
    );
}
