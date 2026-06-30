'use client';

import React from 'react';
import { Layout, Button, Typography, Space, Avatar, Spin } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, LogoutOutlined } from '@ant-design/icons';
import { usePortal } from './PortalContext';
import { signOut } from 'next-auth/react';

const { Header } = Layout;
const { Text } = Typography;

interface PortalTopbarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function PortalTopbar({ collapsed, onToggle }: PortalTopbarProps) {
    const { client, user, loading } = usePortal();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/portal-login' });
    };

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
                
                {loading ? (
                    <Spin size="small" />
                ) : (
                    <Space>
                        {client?.logo && (
                            <img 
                                src={client.logo} 
                                alt={client.businessName} 
                                style={{ height: 32, objectFit: 'contain', borderRadius: 4 }}
                            />
                        )}
                        <Text strong style={{ fontSize: 16 }}>{client?.businessName}</Text>
                    </Space>
                )}
            </Space>

            <Space size="large">
                {!loading && user && (
                    <Space size={12}>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <Text strong style={{ fontSize: 13, lineHeight: '18px' }}>{user.name}</Text>
                            <Text type="secondary" style={{ fontSize: 11, lineHeight: '14px' }}>
                                {user.designation || 'Client Stakeholder'}
                            </Text>
                        </div>
                        <Avatar 
                            style={{ backgroundColor: '#FF6584' }}
                        >
                            {user.name?.charAt(0)}
                        </Avatar>
                    </Space>
                )}
                
                <Button 
                    type="text" 
                    icon={<LogoutOutlined />} 
                    danger
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                    Logout
                </Button>
            </Space>
        </Header>
    );
}
