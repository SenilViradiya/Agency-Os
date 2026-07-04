'use client';

import { useState, useEffect } from 'react';
import { Layout, App, Result, Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const { Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { data: session, status } = useSession();
    const pathname = usePathname();

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

    // Determine authorization status
    const currentRole = (session?.user as any)?.role;
    let isAuthorized = true;

    if (status === 'authenticated') {
        if (pathname.startsWith('/admin')) {
            isAuthorized = currentRole === 'Super Admin';
        } else if (pathname.startsWith('/roles')) {
            isAuthorized = currentRole === 'Super Admin';
        } else if (pathname.startsWith('/users')) {
            isAuthorized = currentRole === 'Super Admin' || currentRole === 'Manager';
        } else if (pathname.startsWith('/finance')) {
            isAuthorized = currentRole === 'Super Admin' || currentRole === 'Manager' || currentRole === 'Editor';
        } else if (pathname.startsWith('/hr')) {
            isAuthorized = currentRole === 'Super Admin' || currentRole === 'Manager' || currentRole === 'Editor';
        }
    }

    return (
        <App>
            <Layout style={{ height: '100vh', overflow: 'hidden' }}>
                <Sidebar collapsed={collapsed} onCollapse={setCollapsed} isMobile={isMobile} />
                <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                    <Topbar collapsed={collapsed} onToggle={toggleCollapsed} />
                    <Content style={{ 
                        padding: isMobile ? '16px' : '24px 32px',
                        margin: 0,
                        flex: 1,
                        overflowY: 'auto',
                        transition: 'all 0.2s',
                        backgroundColor: '#F4F6F9'
                    }}>
                        {status === 'loading' ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
                                <Spin size="large" tip="Verifying access..." />
                            </div>
                        ) : !isAuthorized ? (
                            <div style={{ padding: '40px 0' }}>
                                <Result
                                    status="403"
                                    title="Forbidden"
                                    subTitle="Access Denied: You do not have permission to view this resource."
                                />
                            </div>
                        ) : (
                            children
                        )}
                    </Content>
                </Layout>
            </Layout>
        </App>
    );
}
