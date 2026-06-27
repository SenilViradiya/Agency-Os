'use client';

import React from 'react';
import { Layout, Menu, Typography, Avatar, Divider, Button, Tooltip } from 'antd';
import {
    DashboardOutlined as DashboardIcon,
    TeamOutlined as PeopleIcon,
    SafetyCertificateOutlined as AdminIcon,
    LogoutOutlined as LogoutIcon,
    SolutionOutlined as LeadsIcon,
    ShopOutlined as ClientsIcon,
    ProjectOutlined as ProjectsIcon,
    RocketOutlined as FinanceIcon,
    VideoCameraOutlined as MeetingsIcon,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const { Sider } = Layout;
const { Text, Title } = Typography;

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    isMobile: boolean;
}

export default function Sidebar({ collapsed, onCollapse, isMobile }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    const currentRole = (session?.user as any)?.role;

    const menuItems = [
        { key: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, role: 'all' },
        { key: '/leads', label: 'Leads', icon: <LeadsIcon />, role: 'all' },
        { key: '/clients', label: 'Clients', icon: <ClientsIcon />, role: 'all' },
        { key: '/projects', label: 'Projects', icon: <ProjectsIcon />, role: 'all' },
        { key: '/users', label: 'Users', icon: <PeopleIcon />, role: 'all' },
        { key: '/roles', label: 'Roles', icon: <AdminIcon />, role: 'super-admin-only' },
    ];

    const filteredItems = menuItems.filter(item => {
        if (item.role === 'super-admin-only' && currentRole !== 'Super Admin') return false;
        return true;
    });

    const comingSoonItems = [
        { key: 'finance', label: 'Finance', icon: <FinanceIcon />, disabled: true },
        { key: 'meetings', label: 'Meetings', icon: <MeetingsIcon />, disabled: true },
    ];

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={onCollapse}
            breakpoint="lg"
            width={260}
            collapsedWidth={80}
            style={{
                height: '100vh',
                position: 'sticky',
                top: 0,
                left: 0,
                backgroundColor: '#1A1A2E',
            }}
        >
            <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', overflow: 'hidden' }}>
                <Title level={4} style={{ color: '#6C63FF', margin: 0, display: collapsed ? 'none' : 'block' }}>
                    AgencyOS
                </Title>
                {collapsed && <Text style={{ color: '#6C63FF', fontWeight: 800, fontSize: 20 }}>A</Text>}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                items={filteredItems.map(item => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                    onClick: () => router.push(item.key),
                }))}
                style={{ backgroundColor: 'transparent', borderRight: 0 }}
            />

            {!collapsed && (
                <div style={{ padding: '16px 24px' }}>
                    <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Coming Soon
                    </Text>
                </div>
            )}

            <Menu
                theme="dark"
                mode="inline"
                items={comingSoonItems.map(item => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                    disabled: true,
                }))}
                style={{ backgroundColor: 'transparent', borderRight: 0, opacity: 0.5 }}
            />

            <div style={{ marginTop: 'auto', padding: '16px' }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    padding: '8px', 
                    borderRadius: 8, 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    marginBottom: 12,
                    justifyContent: collapsed ? 'center' : 'flex-start'
                }}>
                    <Avatar 
                        src={session?.user?.image} 
                        style={{ backgroundColor: '#6C63FF', minWidth: 32 }}
                    >
                        {session?.user?.name?.charAt(0)}
                    </Avatar>
                    {!collapsed && (
                        <div style={{ overflow: 'hidden' }}>
                            <Text strong style={{ color: 'white', display: 'block' }} ellipsis>
                                {session?.user?.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {currentRole}
                            </Text>
                        </div>
                    )}
                </div>
                
                <Button 
                    type="text" 
                    icon={<LogoutIcon />} 
                    danger 
                    block 
                    onClick={handleLogout}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: '#FF6584'
                    }}
                >
                    {!collapsed && 'Logout'}
                </Button>
            </div>
        </Sider>
    );
}
