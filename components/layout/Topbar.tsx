'use client';

import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Badge, Popover, Avatar, Dropdown, Modal } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, BellOutlined, UserOutlined, LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPopover from './NotificationPopover';
import { signOut, useSession } from 'next-auth/react';

const { Header } = Layout;

interface TopbarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Topbar({ collapsed, onToggle }: TopbarProps) {
    const { unreadCount } = useNotifications();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut({
            callbackUrl: '/login',
            redirect: true,
        });
    };

    const handleLogoutClick = () => {
        Modal.confirm({
            title: 'Log out of AgencyOS?',
            icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: "You'll need to sign in again to access your dashboard.",
            okText: 'Log Out',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: handleLogout,
        });
    };

    const currentRole = (session?.user as any)?.role;
    const profileMenuItems = [
        {
            key: 'profile-info',
            label: (
                <div style={{ padding: '4px 8px' }}>
                    <Typography.Text strong style={{ display: 'block' }}>{session?.user?.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{session?.user?.email}</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                        <Badge color="#6C63FF" text={currentRole || 'User'} />
                    </div>
                </div>
            ),
            disabled: true,
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: 'Log Out',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: handleLogoutClick,
        }
    ];

    return (
        <Header style={{ 
            padding: '0 24px', 
            background: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            zIndex: 1,
            position: 'sticky',
            top: 0
        }}>
            <Space size="large">
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={onToggle}
                    style={{ fontSize: '16px', width: 40, height: 40 }}
                />
            </Space>

            <Space size="large">
                <Popover
                    content={<NotificationPopover onClose={() => setPopoverOpen(false)} />}
                    trigger="click"
                    open={popoverOpen}
                    onOpenChange={setPopoverOpen}
                    placement="bottomRight"
                    styles={{ content: { padding: 0 } }}
                >
                    <Badge count={unreadCount} overflowCount={99} size="small">
                        <Button type="text" icon={<BellOutlined />} style={{ fontSize: '18px' }} />
                    </Badge>
                </Popover>
                
                <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
                    <Space size={8} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, transition: 'all 0.3s' }} className="hover-bg">
                        <Avatar 
                            src={session?.user?.image} 
                            icon={!session?.user?.image && <UserOutlined />} 
                            style={{ backgroundColor: '#6C63FF' }}
                        />
                        <Typography.Text strong>{session?.user?.name}</Typography.Text>
                    </Space>
                </Dropdown>
            </Space>
        </Header>
    );
}
