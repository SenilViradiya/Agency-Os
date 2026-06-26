'use client';

import React from 'react';
import { Card, Typography, Space, Tag, Avatar, Button, Divider, Tooltip, Flex, Row, Col } from 'antd';
import {
    EyeOutlined,
    StarFilled,
    ProjectOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Text, Title } = Typography;

interface ClientCardProps {
    client: any;
}

const getTierColor = (tier: string) => {
    switch (tier) {
        case 'enterprise': return { color: '#faad14', bg: '#fffbe6' };
        case 'premium': return { color: '#722ed1', bg: '#f9f0ff' };
        default: return { color: '#8c8c8c', bg: '#f5f5f5' };
    }
};

export default function ClientCard({ client }: ClientCardProps) {
    const router = useRouter();
    const tierStyle = getTierColor(client.tier);
    const contractEnd = client.contractEndDate ? dayjs(client.contractEndDate) : null;
    const isExpiringSoon = contractEnd && contractEnd.diff(dayjs(), 'days') <= 30;

    return (
        <Card
            hoverable
            style={{ 
                borderRadius: 12, 
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                height: '100%'
            }}
            styles={{
                body: { padding: '24px' }
            }}
        >
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
                <Flex gap={12} align="center">
                    <Avatar 
                        src={client.logo} 
                        shape="square" 
                        size={48} 
                        style={{ backgroundColor: '#6C63FF', borderRadius: 8 }}
                    >
                        {client.businessName.charAt(0)}
                    </Avatar>
                    <div>
                        <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                            {client.businessName}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {client.contactPerson}
                        </Text>
                    </div>
                </Flex>
                <StatusChip status={client.status} />
            </Flex>

            <Flex gap={8} style={{ marginBottom: 20 }}>
                <Tag 
                    icon={<StarFilled style={{ color: tierStyle.color }} />} 
                    color={tierStyle.bg}
                    style={{ color: tierStyle.color, fontWeight: 700, textTransform: 'capitalize', border: 'none' }}
                >
                    {client.tier}
                </Tag>
                <Tag 
                    icon={<ProjectOutlined />} 
                    color="blue"
                    style={{ fontWeight: 700 }}
                >
                    {client.activeProjectsCount || 0} Active
                </Tag>
            </Flex>

            <Divider style={{ margin: '0 0 16px 0' }} />

            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                        RETAINER
                    </Text>
                    <Text strong style={{ fontSize: 14 }}>
                        ₹{client.monthlyRetainerValue?.toLocaleString('en-IN')}
                    </Text>
                </Col>
                <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                        EXPIRY
                    </Text>
                    <Text strong style={{ fontSize: 14, color: isExpiringSoon ? '#ff4d4f' : 'inherit' }}>
                        {contractEnd ? contractEnd.format('DD MMM, YYYY') : 'Lifetime'}
                    </Text>
                </Col>
            </Row>

            <Flex justify="space-between" align="center">
                <Flex align="center" gap={8}>
                    <Tooltip title={`Manager: ${client.assignedManager?.name}`}>
                        <Avatar size={24} src={client.assignedManager?.avatar}>
                            {client.assignedManager?.name?.charAt(0)}
                        </Avatar>
                    </Tooltip>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                        {client.assignedManager?.name?.split(' ')[0]}
                    </Text>
                </Flex>
                <Button 
                    type="primary" 
                    ghost
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => router.push(`/clients/${client._id}`)}
                >
                    View
                </Button>
            </Flex>
        </Card>
    );
}
