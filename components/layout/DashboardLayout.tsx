'use client';

import { useState, useEffect } from 'react';
import { Layout, App } from 'antd';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const { Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </App>
    );
}
