'use client';

import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
    HomeOutlined as OverviewIcon,
    FolderOpenOutlined as ProjectsIcon,
    CalendarOutlined as ContentIcon,
    FileTextOutlined as InvoicesIcon,
    UserOutlined as ProfileIcon,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface PortalSidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    isMobile: boolean;
}

export default function PortalSidebar({ collapsed, onCollapse, isMobile }: PortalSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        { key: '/portal', label: 'Overview', icon: <OverviewIcon /> },
        { key: '/portal/projects', label: 'Your Projects', icon: <ProjectsIcon /> },
        { key: '/portal/content', label: 'Content Calendar', icon: <ContentIcon /> },
        { key: '/portal/invoices', label: 'Invoices', icon: <InvoicesIcon /> },
        { key: '/portal/profile', label: 'My Profile', icon: <ProfileIcon /> },
    ];

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={onCollapse}
            breakpoint="lg"
            width={260}
            collapsedWidth={80}
            className="sidebar-scroll"
            style={{
                height: '100vh',
                position: 'sticky',
                top: 0,
                left: 0,
                backgroundColor: '#1E1E38', // Distinct indigo-accent dark color for Client Portal
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', overflow: 'hidden' }}>
                <Title level={4} style={{ color: '#FF6584', margin: 0, display: collapsed ? 'none' : 'block' }}>
                    AgencyOS
                </Title>
                {collapsed && <Text style={{ color: '#FF6584', fontWeight: 800, fontSize: 20 }}>C</Text>}
            </div>

            <div style={{ padding: '8px 16px', display: collapsed ? 'none' : 'block' }}>
                <Text style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    Client Portal
                </Text>
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                items={menuItems.map(item => ({
                    ...item,
                    onClick: () => router.push(item.key),
                }))}
                style={{ backgroundColor: 'transparent', borderRight: 0 }}
            />
        </Sider>
    );
}
