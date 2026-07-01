'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Avatar, Divider, Button, Tooltip, Badge, Modal } from 'antd';
import {
    DashboardOutlined as DashboardIcon,
    TeamOutlined as PeopleIcon,
    SafetyCertificateOutlined as AdminIcon,
    LogoutOutlined as LogoutIcon,
    SolutionOutlined as LeadsIcon,
    ShopOutlined as ClientsIcon,
    ProjectOutlined as ProjectsIcon,
    RocketOutlined as PublishingIcon,
    VideoCameraOutlined as MeetingsIcon,
    FileSearchOutlined as ApprovalsIcon,
    UnorderedListOutlined as TasksIcon,
    BarChartOutlined as AnalyticsIcon,
    UserOutlined as EmployeesIcon,
    CalendarOutlined as AttendanceIcon,
    FileProtectOutlined as LeavesIcon,
    DollarOutlined as PayrollIcon,
    TrophyOutlined as PerformanceIcon,
    NotificationOutlined as AnnouncementsIcon,
    ApartmentOutlined as HRIcon,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { hasPermission } from '@/lib/rbac';

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
    const [counts, setCounts] = useState({ pendingApprovals: 0, readyToPublish: 0, revisionsRequested: 0, pendingLeaves: 0 });

    const fetchCounts = async () => {
        try {
            // Simplified fetch for sidebar badges
            const appRes = await apiClient.get('/approvals?limit=1');
            const pubRes = await apiClient.get('/publishing?status=ready_to_publish&limit=1');
            
            // For editors, we also want to see revision_requested count
            const revRes = await apiClient.get('/approvals?status=revision_requested&limit=1');

            // HR pending leaves count
            let pendingLeaves = 0;
            try {
                const lvRes = await apiClient.get('/hr/leaves?status=pending&limit=1');
                pendingLeaves = lvRes.data?.meta?.total || 0;
            } catch { /* HR module may not be accessible */ }

            setCounts({
                pendingApprovals: appRes.data.pagination.total,
                readyToPublish: pubRes.data.pagination.total,
                revisionsRequested: revRes.data.pagination.total,
                pendingLeaves,
            });
        } catch (error) {
            console.error('Failed to fetch sidebar counts:', error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchCounts();
            const interval = setInterval(fetchCounts, 60000); // Refresh every minute
            return () => clearInterval(interval);
        }
    }, [session]);

    const handleLogout = async () => {
        await signOut({
            callbackUrl: '/login',
            redirect: true,
        });
    };

    const handleLogoutClick = () => {
        Modal.confirm({
            title: 'Log out of AgencyOS?',
            icon: <ExclamationCircleOutlined />,
            content: "You'll need to sign in again to access your dashboard.",
            okText: 'Log Out',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: handleLogout,
        });
    };

    const currentRole = (session?.user as any)?.role;
    const isManager = currentRole === 'Manager' || currentRole === 'Super Admin' || currentRole === 'Admin';

    const menuItems = [
        { key: 'dashboard', type: 'group', label: 'Overview', children: [
            { key: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        ]},
        { key: 'crm', type: 'group', label: 'CRM', children: [
            { key: '/leads', label: 'Leads', icon: <LeadsIcon /> },
            { key: '/clients', label: 'Clients', icon: <ClientsIcon /> },
            { key: '/clients/portal-access', label: 'Portal Access', icon: <AdminIcon /> },
            { key: '/projects', label: 'Projects', icon: <ProjectsIcon /> },
        ]},
        { key: 'production', type: 'group', label: 'Production', children: [
            { key: '/tasks', label: 'Tasks', icon: <TasksIcon /> },
            { key: '/content', label: 'Content Planner', icon: <MeetingsIcon /> },
            { 
                key: '/approvals', 
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Approvals</span>
                        {!collapsed && (
                            <Badge 
                                count={isManager ? counts.pendingApprovals : counts.revisionsRequested} 
                                color={isManager ? '#ff4d4f' : '#faad14'} 
                                size="small" 
                            />
                        )}
                    </div>
                ), 
                icon: <ApprovalsIcon /> 
            },
            { 
                key: '/publishing', 
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Publishing</span>
                        {!collapsed && <Badge count={counts.readyToPublish} color="#1890ff" size="small" />}
                    </div>
                ), 
                icon: <PublishingIcon /> 
            },
        ]},
        { key: 'insights', type: 'group', label: 'Insights', children: [
            { key: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
        ]},
        { key: 'hr', type: 'group', label: 'HR', children: [
            { key: '/hr', label: 'HR Dashboard', icon: <HRIcon /> },
            { key: '/hr/employees', label: 'Employees', icon: <EmployeesIcon /> },
            { key: '/hr/attendance', label: 'Attendance', icon: <AttendanceIcon /> },
            {
                key: '/hr/leaves',
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Leaves</span>
                        {!collapsed && isManager && (
                            <Badge count={counts.pendingLeaves} color="#ff4d4f" size="small" />
                        )}
                    </div>
                ),
                icon: <LeavesIcon />,
            },
            ...(isManager ? [
                { key: '/hr/payroll', label: 'Payroll', icon: <PayrollIcon /> },
            ] : []),
            { key: '/hr/performance', label: 'Performance', icon: <PerformanceIcon /> },
            { key: '/hr/announcements', label: 'Announcements', icon: <AnnouncementsIcon /> },
        ]},
        { key: 'finance_group', type: 'group', label: 'Finance', children: [
            { key: '/finance', label: 'Finance Portal', icon: <PayrollIcon /> },
        ]},
        { key: 'admin', type: 'group', label: 'System', children: [
            { key: '/users', label: 'Users', icon: <PeopleIcon /> },
            ...(currentRole === 'Super Admin' ? [{ key: '/roles', label: 'Roles', icon: <AdminIcon /> }] : []),
        ]},
    ];

    const filteredItems = menuItems
        .map(group => {
            const filteredChildren = group.children?.filter(item => {
                let moduleName: string | null = null;
                if (item.key === '/dashboard') return true;
                if (item.key === '/leads') moduleName = 'leads';
                if (item.key === '/clients') moduleName = 'clients';
                if (item.key === '/clients/portal-access') moduleName = 'clients';
                if (item.key === '/projects') moduleName = 'projects';
                if (item.key === '/tasks') moduleName = 'tasks';
                if (item.key === '/content') moduleName = 'content';
                if (item.key === '/approvals') moduleName = 'approvals';
                if (item.key === '/publishing') moduleName = 'publishing';
                if (item.key === '/analytics') moduleName = 'analytics';
                if (item.key === '/hr') moduleName = 'hr';
                if (item.key === '/hr/employees') moduleName = 'hr';
                if (item.key === '/hr/attendance') moduleName = 'hr';
                if (item.key === '/hr/leaves') moduleName = 'hr';
                if (item.key === '/hr/payroll') moduleName = 'hr';
                if (item.key === '/hr/performance') moduleName = 'hr';
                if (item.key === '/hr/announcements') moduleName = 'hr';
                if (item.key === '/finance') moduleName = 'finance';
                if (item.key === '/users') moduleName = 'users';
                if (item.key === '/roles') moduleName = 'roles';
                
                if (!moduleName) return true;
                return hasPermission(session?.user, moduleName, 'read');
            });
            
            return {
                ...group,
                children: filteredChildren,
            };
        })
        .filter(group => group.children && group.children.length > 0);


    const comingSoonItems = [
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
            className="sidebar-scroll"
            style={{
                height: '100vh',
                position: 'sticky',
                top: 0,
                left: 0,
                backgroundColor: '#1A1A2E',
                overflowY: 'auto',
                overflowX: 'hidden',
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
                items={filteredItems.map(group => ({
                    ...group,
                    type: group.type as "group",
                    children: group.children?.map(item => ({
                        ...item,
                        onClick: () => router.push(item.key as string),
                    }))
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
                <Tooltip title="Log Out" placement="right" open={collapsed ? undefined : false}>
                    <div 
                        onClick={handleLogoutClick}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 12, 
                            padding: '8px', 
                            borderRadius: 8, 
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            marginBottom: 12,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        className="sidebar-profile-box"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        }}
                    >
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
                </Tooltip>
                
                <Button 
                    type="text" 
                    icon={<LogoutIcon />} 
                    danger 
                    block 
                    onClick={handleLogoutClick}
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
