'use client';

import React from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, BellOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

interface TopbarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Topbar({ collapsed, onToggle }: TopbarProps) {
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
                    style={{ fontSize: '16px', width: 64, height: 64 }}
                />
            </Space>

            <Space size="middle">
                <Button type="text" icon={<BellOutlined />} style={{ fontSize: '18px' }} />
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BellOutlined style={{ color: '#8c8c8c' }} />
                </div>
            </Space>
        </Header>
    );
}
