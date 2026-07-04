'use client';

import React from 'react';
import { Card, Typography, List, Badge, Flex } from 'antd';
import PageHeader from '@/components/shared/PageHeader';

const { Title, Paragraph, Text } = Typography;

export default function AdminPage() {
    const mockLogs = [
        { id: 1, action: 'User login', user: 'admin@agencyos.com', timestamp: 'Just now', type: 'success' },
        { id: 2, action: 'Role updated', user: 'admin@agencyos.com', timestamp: '5 mins ago', type: 'info' },
        { id: 3, action: 'Invoice sent', user: 'system', timestamp: '1 hour ago', type: 'success' },
    ];

    return (
        <div>
            <PageHeader 
                title="System Administration" 
                subtitle="Manage global system logs and server audits" 
            />
            
            <Card style={{ borderRadius: 12, marginTop: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Title level={4}>Audit Logs</Title>
                <Paragraph type="secondary">
                    View real-time records of admin activities and authorization checks.
                </Paragraph>
                
                <List
                    itemLayout="horizontal"
                    dataSource={mockLogs}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                title={
                                    <Flex gap={8} align="center">
                                        <Text strong>{item.action}</Text>
                                        <Badge status={item.type as any} />
                                    </Flex>
                                }
                                description={
                                    <Paragraph style={{ margin: 0 }}>
                                        Triggered by <Text type="secondary">{item.user}</Text> &bull; {item.timestamp}
                                    </Paragraph>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
}
