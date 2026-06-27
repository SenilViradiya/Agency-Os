'use client';

import React from 'react';
import { Timeline, Typography, Tag, Space, Avatar, Empty } from 'antd';
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined,
    UserOutlined,
    LinkOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

export default function ApprovalHistoryTimeline({ history }: { history: any[] }) {
    if (!history || history.length === 0) {
        return (
            <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No revision history yet ✓" 
                style={{ padding: '40px 0' }}
            />
        );
    }

    return (
        <div style={{ padding: '24px 16px' }}>
            <Timeline
                mode="left"
                items={history.map((rev, index) => ({
                    color: rev.resolvedAt ? 'green' : 'orange',
                    label: dayjs(rev.requestedAt).format('DD MMM, HH:mm'),
                    children: (
                        <div style={{ marginBottom: 24 }}>
                            <Space align="center" style={{ marginBottom: 8 }}>
                                <Tag color="orange" style={{ fontWeight: 600 }}>REV #{rev.revisionNumber}</Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>Requested by {rev.requestedBy?.name || 'Manager'}</Text>
                            </Space>
                            
                            <div style={{ backgroundColor: '#fff2f0', padding: '12px', borderRadius: 8, borderLeft: '3px solid #ff4d4f', marginBottom: 12 }}>
                                <Text strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>REVISION NOTES:</Text>
                                <Text style={{ fontSize: 13 }}>{rev.revisionNotes}</Text>
                            </div>

                            {rev.resolvedAt ? (
                                <div style={{ backgroundColor: '#f6ffed', padding: '12px', borderRadius: 8, borderLeft: '3px solid #52c41a' }}>
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                        <Text strong style={{ display: 'block', fontSize: 13, color: '#52c41a' }}>
                                            <CheckCircleOutlined /> RESOLVED ON {dayjs(rev.resolvedAt).format('DD MMM, HH:mm')}
                                        </Text>
                                        {rev.driveLink && (
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <LinkOutlined /> <a href={rev.driveLink} target="_blank" rel="noreferrer">View Updated Content</a>
                                            </Text>
                                        )}
                                    </Space>
                                </div>
                            ) : (
                                <Text type="warning" style={{ fontSize: 12, fontWeight: 500 }}>
                                    <ClockCircleOutlined /> AWAITING RESUBMISSION
                                </Text>
                            )}
                        </div>
                    )
                }))}
            />
        </div>
    );
}
