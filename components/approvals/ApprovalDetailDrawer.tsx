'use client';

import React, { useState } from 'react';
import { 
    Drawer, 
    Tabs, 
    Descriptions, 
    Typography, 
    Tag, 
    Button, 
    Space, 
    Alert, 
    Divider,
    Flex,
    Input,
    Empty,
    App
} from 'antd';
import { 
    GoogleOutlined, 
    LinkOutlined, 
    CopyOutlined, 
    InfoCircleOutlined,
    HistoryOutlined,
    FileSearchOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ApprovalHistoryTimeline from './ApprovalHistoryTimeline';
import PipelineStageBar from '../content/PipelineStageBar';

const { Text, Title, Paragraph } = Typography;

interface ApprovalDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    item: any;
}

export default function ApprovalDetailDrawer({ open, onClose, item }: ApprovalDetailDrawerProps) {
    const { message } = App.useApp();
    if (!item) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(item.approvalData.driveLink);
        message.success('Link copied to clipboard');
    };

    const statusColors: any = {
        'not_submitted': 'default',
        'pending_review': 'processing',
        'approved': 'success',
        'revision_requested': 'error'
    };

    const items = [
        {
            key: 'info',
            label: <Space><InfoCircleOutlined /> Content Info</Space>,
            children: (
                <div style={{ padding: '20px 0' }}>
                    <PipelineStageBar currentStage={item.currentStage} stageStatuses={item.stageStatuses || {}} />
                    <Divider />
                    
                    <Descriptions title="Overview" bordered column={1} size="small">
                        <Descriptions.Item label="Content ID">{item.contentNumber}</Descriptions.Item>
                        <Descriptions.Item label="Type"><Tag color="blue">{item.contentType.replace('_', ' ').toUpperCase()}</Tag></Descriptions.Item>
                        <Descriptions.Item label="Project">{item.projectId?.name}</Descriptions.Item>
                        <Descriptions.Item label="Client">{item.clientId?.businessName}</Descriptions.Item>
                        <Descriptions.Item label="Planned Date">{item.plannedPublishDate ? dayjs(item.plannedPublishDate).format('DD MMM YYYY') : 'Not Set'}</Descriptions.Item>
                    </Descriptions>

                    <Divider />
                    
                    <Title level={5}>Submission Details</Title>
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Submitted By">{item.approvalData.submittedBy?.name}</Descriptions.Item>
                        <Descriptions.Item label="Submitted At">{dayjs(item.approvalData.submittedForReviewAt).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
                    </Descriptions>
                    
                    {item.approvalData.submissionNotes && (
                        <div style={{ marginTop: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Submission Notes:</Text>
                            <Paragraph style={{ padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                                {item.approvalData.submissionNotes}
                            </Paragraph>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'preview',
            label: <Space><FileSearchOutlined /> Drive Preview</Space>,
            children: (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div 
                        style={{ 
                            padding: '60px', 
                            border: '2px dashed #d9d9d9', 
                            borderRadius: 16, 
                            cursor: 'pointer',
                            backgroundColor: '#fafafa',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => window.open(item.approvalData.driveLink, '_blank')}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#6C63FF'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
                    >
                        <GoogleOutlined style={{ fontSize: 64, color: '#4285F4', marginBottom: 24 }} />
                        <Title level={4}>Google Drive Content</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                            Click to open the file in a new tab for full review.
                        </Text>
                        <Button type="primary" size="large" icon={<LinkOutlined />}>Open in Google Drive</Button>
                    </div>

                    <div style={{ marginTop: 32, textAlign: 'left' }}>
                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Direct Link:</Text>
                        <Input.Search
                            value={item.approvalData.driveLink}
                            enterButton={<CopyOutlined />}
                            readOnly
                            onSearch={copyToClipboard}
                            size="large"
                        />
                    </div>
                </div>
            )
        },
        {
            key: 'history',
            label: <Space><HistoryOutlined /> Revision History</Space>,
            children: <ApprovalHistoryTimeline history={item.approvalData.revisionHistory} />
        }
    ];

    return (
        <Drawer
            title={
                <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 24 }}>
                    <Space>
                        <Text strong style={{ fontSize: 18 }}>{item.title}</Text>
                        <Tag color={statusColors[item.approvalData.status]}>
                            {item.approvalData.status.replace('_', ' ').toUpperCase()}
                        </Tag>
                    </Space>
                </Flex>
            }
            width={600}
            onClose={onClose}
            open={open}
            destroyOnClose
        >
            <Tabs defaultActiveKey="info" items={items} />
        </Drawer>
    );
}
