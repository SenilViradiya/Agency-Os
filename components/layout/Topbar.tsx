'use client';

import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Badge, Popover, Avatar } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPopover from './NotificationPopover';
import { useSession } from 'next-auth/react';

const { Header } = Layout;

interface TopbarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Topbar({ collapsed, onToggle }: TopbarProps) {
    const { unreadCount } = useNotifications();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const { data: session } = useSession();

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
                
                <Space size={8} style={{ cursor: 'pointer' }}>
                    <Avatar 
                        src={session?.user?.image} 
                        icon={!session?.user?.image && <UserOutlined />} 
                        style={{ backgroundColor: '#6C63FF' }}
                    />
                    <Typography.Text strong>{session?.user?.name}</Typography.Text>
                </Space>
            </Space>
        </Header>
    );
}
