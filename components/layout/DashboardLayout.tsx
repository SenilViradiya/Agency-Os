'use client';

import { useState, useEffect } from 'react';
import { Layout } from 'antd';
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
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={setCollapsed} isMobile={isMobile} />
            <Layout>
                <Topbar collapsed={collapsed} onToggle={toggleCollapsed} />
                <Content style={{ 
                    padding: isMobile ? '16px' : '24px 32px',
                    margin: 0,
                    minHeight: 280,
                    transition: 'all 0.2s'
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
