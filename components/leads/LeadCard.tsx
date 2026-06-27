'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Typography, Space, Tag, Avatar, Tooltip, Divider, Flex } from 'antd';
import {
    WhatsAppOutlined,
    TeamOutlined,
    MailOutlined,
    PhoneOutlined,
    InstagramOutlined,
    GlobalOutlined,
    EllipsisOutlined,
    HolderOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface LeadCardProps {
    lead: any;
    onClick: (lead: any) => void;
}

const getSourceIcon = (source: string) => {
    switch (source) {
        case 'whatsapp': return <WhatsAppOutlined />;
        case 'referral': return <TeamOutlined />;
        case 'cold_email': return <MailOutlined />;
        case 'cold_call': return <PhoneOutlined />;
        case 'instagram': return <InstagramOutlined />;
        case 'website': return <GlobalOutlined />;
        default: return <EllipsisOutlined />;
    }
};

const getSourceColor = (source: string) => {
    switch (source) {
        case 'whatsapp': return 'success';
        case 'referral': return 'blue';
        case 'cold_email': return 'orange';
        case 'instagram': return 'magenta';
        default: return 'default';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return '#ff4d4f';
        case 'medium': return '#faad14';
        case 'low': return '#52c41a';
        default: return '#d9d9d9';
    }
};

export default function LeadCard({ lead, onClick }: LeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead._id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'default',
        marginBottom: 12,
    };

    const isOverdue = lead.followUpDate && dayjs(lead.followUpDate).isBefore(dayjs(), 'day');

    return (
        <div ref={setNodeRef} style={style}>
            <Card
                size="small"
                hoverable
                onClick={() => onClick(lead)}
                styles={{
                    body: { padding: '12px' }
                }}
            >
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                        {lead.leadNumber}
                    </Text>
                    <div
                        {...attributes}
                        {...listeners}
                        style={{ cursor: 'grab', color: '#bfbfbf' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <HolderOutlined style={{ fontSize: 14 }} />
                    </div>
                </Flex>

                <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 14 }}>
                    {lead.businessName}
                </Title>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                    {lead.name}
                </Text>

                <Flex wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
                    <Tag 
                        icon={getSourceIcon(lead.source)} 
                        color={getSourceColor(lead.source)}
                        style={{ fontSize: 10, margin: 0, textTransform: 'capitalize' }}
                    >
                        {lead.source.replace('_', ' ')}
                    </Tag>
                    <Flex align="center" gap={4} style={{ marginLeft: 'auto' }}>
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: getPriorityColor(lead.priority),
                        }} />
                        <Text style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                            {lead.priority}
                        </Text>
                    </Flex>
                </Flex>

                <Divider style={{ margin: '8px 0' }} />

                <Flex justify="space-between" align="center">
                    <div>
                        <Text type="secondary" style={{ fontSize: 10, display: 'block', fontWeight: 600 }}>
                            BUDGET
                        </Text>
                        <Text strong style={{ color: '#6C63FF' }}>
                            ₹{lead.budget?.toLocaleString('en-IN')}
                        </Text>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        {lead.followUpDate ? (
                            <>
                                <Text type={isOverdue ? 'danger' : 'secondary'} style={{ fontSize: 10, display: 'block', fontWeight: 600 }}>
                                    FOLLOW-UP
                                </Text>
                                <Text strong style={{ color: isOverdue ? '#ff4d4f' : 'inherit', fontSize: 12 }}>
                                    {dayjs(lead.followUpDate).format('DD MMM')}
                                </Text>
                            </>
                        ) : (
                            <Tooltip title={lead.assignedTo?.name || 'Unassigned'}>
                                <Avatar size={24} src={lead.assignedTo?.avatar}>
                                    {lead.assignedTo?.name?.charAt(0)}
                                </Avatar>
                            </Tooltip>
                        )}
                    </div>
                </Flex>
            </Card>
        </div>
    );
}
