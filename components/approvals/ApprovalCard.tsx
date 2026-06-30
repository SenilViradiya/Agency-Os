'use client';

import React from 'react';
import { Card, Flex, Tag, Typography, Avatar, Button, Space, Tooltip, Badge } from 'antd';
import { 
    GlobalOutlined, 
    GoogleOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined, 
    EyeOutlined,
    ClockCircleOutlined,
    LinkOutlined,
    UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
const { Text, Title, Paragraph } = Typography;

interface ApprovalCardProps {
    item: any;
    onApprove: (item: any) => void;
    onRevision: (item: any) => void;
    onViewDetail: (item: any) => void;
    isEditor?: boolean;
}

export default function ApprovalCard({ item, onApprove, onRevision, onViewDetail, isEditor }: ApprovalCardProps) {
    const { 
        title, 
        contentNumber, 
        contentType, 
        platforms, 
        clientId, 
        projectId, 
        approvalData,
        assignedTo 
    } = item;

    const submittedBy = approvalData.submittedBy;
    const timeAgo = dayjs(approvalData.submittedForReviewAt).fromNow();

    return (
        <Card 
            hoverable 
            styles={{ body: { padding: '20px' } }}
            style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        >
            <Flex justify="space-between" align="flex-start">
                <Flex gap={20} style={{ flex: 1 }}>
                    {/* Thumbnail Placeholder */}
                    <div style={{ 
                        width: 80, 
                        height: 80, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 12, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #eee'
                    }}>
                        <GlobalOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <Flex gap={8} style={{ marginBottom: 4 }} wrap="wrap">
                            <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>{contentType.replace('_', ' ').toUpperCase()}</Tag>
                            {platforms.map((p: string) => (
                                <Tag key={p} color="default" style={{ borderRadius: 4, margin: 0 }}>{p.toUpperCase()}</Tag>
                            ))}
                            {approvalData.totalRevisions > 0 && (
                                <Tag color="orange" style={{ borderRadius: 4, margin: 0 }}>REV #{approvalData.currentRevisionNumber}</Tag>
                            )}
                        </Flex>

                        <Title level={5} style={{ margin: '4px 0', fontSize: 16 }}>{title}</Title>
                        
                        <Flex gap={8} align="center" style={{ marginBottom: 8, fontSize: 12 }}>
                            <Text type="secondary">{contentNumber}</Text>
                            <VerticalSeparator />
                            <Text type="secondary">{projectId?.name} → {clientId?.businessName}</Text>
                        </Flex>

                        <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                            <Avatar size={20} src={submittedBy?.avatar} icon={!submittedBy?.avatar && <UserOutlined />} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Submitted by <Text strong style={{ fontSize: 12 }}>{submittedBy?.name}</Text> • {timeAgo}
                            </Text>
                        </Flex>

                        {approvalData.submissionNotes && (
                            <Paragraph 
                                type="secondary" 
                                ellipsis={{ rows: 2 }} 
                                style={{ fontSize: 13, backgroundColor: '#fafafa', padding: '8px 12px', borderRadius: 8, fontStyle: 'italic', margin: 0 }}
                            >
                                "{approvalData.submissionNotes}"
                            </Paragraph>
                        )}
                        
                        {item.approvalData.status === 'revision_requested' && (
                            <div style={{ marginTop: 12 }}>
                                <Text type="danger" strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>MANAGER FEEDBACK:</Text>
                                <Paragraph 
                                    style={{ fontSize: 13, backgroundColor: '#fff2f0', padding: '8px 12px', borderLeft: '3px solid #ff4d4f', borderRadius: '0 8px 8px 0', margin: 0 }}
                                >
                                    {approvalData.revisionHistory[approvalData.revisionHistory.length - 1]?.revisionNotes}
                                </Paragraph>
                            </div>
                        )}
                    </div>
                </Flex>

                <Flex vertical gap={8} align="flex-end" style={{ marginLeft: 24 }}>
                    <Button 
                        icon={<LinkOutlined />} 
                        href={approvalData.driveLink} 
                        target="_blank"
                        block
                        style={{ borderRadius: 8 }}
                    >
                        Open Drive Link
                    </Button>
                    
                    {!isEditor && approvalData.status === 'pending_review' && (
                        <>
                            <Button 
                                type="primary" 
                                icon={<CheckCircleOutlined />} 
                                onClick={() => onApprove(item)}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 8 }}
                                block
                            >
                                Approve
                            </Button>
                            <Button 
                                danger 
                                icon={<ExclamationCircleOutlined />} 
                                onClick={() => onRevision(item)}
                                style={{ borderRadius: 8 }}
                                block
                            >
                                Request Revision
                            </Button>
                        </>
                    )}
                    
                    {isEditor && approvalData.status === 'revision_requested' && (
                        <Button 
                            type="primary" 
                            onClick={() => onViewDetail(item)}
                            style={{ borderRadius: 8 }}
                            block
                        >
                            Resubmit
                        </Button>
                    )}

                    <Button 
                        type="text" 
                        icon={<EyeOutlined />} 
                        onClick={() => onViewDetail(item)}
                        style={{ borderRadius: 8 }}
                    >
                        View Details
                    </Button>
                </Flex>
            </Flex>
        </Card>
    );
}

const VerticalSeparator = () => (
    <span style={{ color: '#d9d9d9', margin: '0 8px' }}>|</span>
);

