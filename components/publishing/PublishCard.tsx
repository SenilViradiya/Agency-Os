'use client';

import React from 'react';
import { Card, Flex, Tag, Typography, Avatar, Button, Space, Divider } from 'antd';
import { 
    CheckCircleOutlined, 
    RocketOutlined, 
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
const { Text, Title } = Typography;

interface PublishCardProps {
    item: any;
    onPublish: (item: any) => void;
}

export default function PublishCard({ item, onPublish }: PublishCardProps) {
    const { 
        title, 
        contentNumber, 
        contentType, 
        platforms, 
        clientId, 
        projectId, 
        approvalData,
        publishData 
    } = item;

    const manager = approvalData.reviewedBy;
    const approvedAt = dayjs(approvalData.approvedAt).fromNow();
    const isOverdue = publishData.scheduledAt && dayjs().isAfter(dayjs(publishData.scheduledAt), 'day');
    const isToday = publishData.scheduledAt && dayjs().isSame(dayjs(publishData.scheduledAt), 'day');

    return (
        <Card 
            hoverable 
            styles={{ body: { padding: '20px' } }}
            style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        >
            <Flex justify="space-between" align="center">
                <Flex gap={20} style={{ flex: 1 }}>
                    <div style={{ flex: 1 }}>
                        <Flex gap={8} style={{ marginBottom: 4 }}>
                            <Tag color="purple" style={{ borderRadius: 4 }}>{contentType.replace('_', ' ').toUpperCase()}</Tag>
                            {platforms.map((p: string) => (
                                <Tag key={p} color="default" style={{ borderRadius: 4 }}>{p.toUpperCase()}</Tag>
                            ))}
                        </Flex>

                        <Title level={5} style={{ margin: '4px 0', fontSize: 16 }}>{title}</Title>
                        
                        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>} style={{ marginBottom: 8, fontSize: 12 }}>
                            <Text type="secondary">{contentNumber}</Text>
                            <Text type="secondary">{clientId?.businessName} → {projectId?.name}</Text>
                        </Space>

                        <Flex align="center" gap={8}>
                            <Avatar size={20} src={manager?.avatar} icon={!manager?.avatar && <UserOutlined />} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Approved by <Text strong style={{ fontSize: 12 }}>{manager?.name}</Text> • {approvedAt}
                            </Text>
                        </Flex>
                    </div>

                    <Divider type="vertical" style={{ height: 'auto', margin: '0 20px' }} />

                    <div style={{ width: 220, textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Planned Publish Date</Text>
                        <Title 
                            level={4} 
                            style={{ 
                                margin: '8px 0', 
                                color: isOverdue || isToday ? '#ff4d4f' : '#1890ff',
                                fontSize: 18
                            }}
                        >
                            <CalendarOutlined /> {publishData.scheduledAt ? dayjs(publishData.scheduledAt).format('DD MMM, YYYY') : 'Not Scheduled'}
                        </Title>
                        {isOverdue && <Tag color="error">OVERDUE</Tag>}
                        {isToday && <Tag color="warning">TODAY</Tag>}
                    </div>
                </Flex>

                <div style={{ marginLeft: 32 }}>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<RocketOutlined />} 
                        onClick={() => onPublish(item)}
                        style={{ height: 45, borderRadius: 8, fontWeight: 600 }}
                    >
                        Mark as Published
                    </Button>
                </div>
            </Flex>
        </Card>
    );
}
