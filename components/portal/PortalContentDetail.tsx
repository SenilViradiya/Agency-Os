'use client';

import React, { useEffect, useState } from 'react';
import { Card, Steps, Tag, Typography, Button, Space, Spin, Alert, Row, Col, Flex } from 'antd';
import { ArrowLeftOutlined, LinkOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface PortalContentDetailProps {
    id: string;
}

export default function PortalContentDetail({ id }: PortalContentDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        apiClient.get(`/api/portal/content/${id}`)
            .then(res => {
                if (res.data?.success) {
                    setContent(res.data.data);
                }
            })
            .catch(err => {
                console.error('Failed to load content details', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading deliverable pipeline..." />
            </div>
        );
    }

    if (!content) {
        return (
            <Card style={{ margin: 24, textAlign: 'center' }}>
                <Title level={4}>Access Denied or Deliverable Not Found</Title>
                <Text type="secondary">This content item does not exist or you do not have permission to view it.</Text>
                <div style={{ marginTop: 24 }}>
                    <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push('/portal/content')}>
                        Back to Deliverables
                    </Button>
                </div>
            </Card>
        );
    }

    // Map stages index for Steps component
    const stages = ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish', 'completed'];
    let currentStep = stages.indexOf(content.currentStage);
    if (content.status === 'published') {
        currentStep = stages.indexOf('completed');
    }
    if (currentStep === -1) currentStep = 0;

    const stepsItems = stages.map(stage => ({
        title: stage.toUpperCase(),
        description: content.stageStatuses?.[stage] === 'done' ? 'Completed' : 
                     (content.currentStage === stage && content.status !== 'published') ? 'In Progress' : 'Pending'
    }));

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push('/portal/content')} style={{ paddingLeft: 0, color: '#FF6584' }}>
                    Back to Content Calendar
                </Button>
            </div>

            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size={4}>
                            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{content.title}</Title>
                            <Space wrap>
                                <Text type="secondary">ID: #{content.contentNumber}</Text>
                                <span style={{ color: '#d9d9d9' }}>|</span>
                                <Tag color="purple">{content.contentType?.replace('_', ' ').toUpperCase()}</Tag>
                                <Tag color={
                                    content.status === 'published' ? 'success' :
                                    content.status === 'cancelled' ? 'error' : 'orange'
                                }>{content.status?.toUpperCase()}</Tag>
                            </Space>
                        </Space>
                    </Col>
                    <Col xs={24} md={8}>
                        {content.plannedPublishDate && (
                            <Flex vertical align="end">
                                <Text type="secondary" style={{ fontSize: 12 }}>TARGET PUBLISH DATE</Text>
                                <Space>
                                    <CalendarOutlined style={{ color: '#FF6584' }} />
                                    <Text strong style={{ fontSize: 16 }}>{dayjs(content.plannedPublishDate).format('DD MMM YYYY')}</Text>
                                </Space>
                            </Flex>
                        )}
                    </Col>
                </Row>
            </Card>

            {content.status === 'published' && content.publishData?.publishedUrl && (
                <Alert
                    message={
                        <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                            <Text strong style={{ color: '#1b4b1a' }}>This content is published! View it here:</Text>
                        </Space>
                    }
                    description={
                        <div style={{ marginTop: 8 }}>
                            <Button 
                                type="primary" 
                                icon={<LinkOutlined />} 
                                href={content.publishData.publishedUrl} 
                                target="_blank"
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                View Live Content
                            </Button>
                        </div>
                    }
                    type="success"
                    showIcon={false}
                    style={{ marginBottom: 24, borderRadius: 12 }}
                />
            )}

            <Card title={<span style={{ fontWeight: 600 }}>Production Pipeline Progress</span>} style={{ borderRadius: 12, marginBottom: 24 }}>
                <div style={{ padding: '12px 0' }}>
                    <Steps
                        current={currentStep}
                        items={stepsItems}
                        responsive={true}
                        progressDot
                    />
                </div>
            </Card>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title={<span style={{ fontWeight: 600 }}>Deliverable Specifications</span>} style={{ borderRadius: 12, height: '100%' }}>
                        <Typography.Title level={5}>Description / Brief</Typography.Title>
                        <Paragraph style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fafafa', padding: 16, borderRadius: 8 }}>
                            {content.description || 'No additional brief specifications provided for this deliverable.'}
                        </Paragraph>

                        <div style={{ marginTop: 24 }}>
                            <Title level={5} style={{ marginBottom: 12 }}>Distribution Platforms</Title>
                            <Space size={8}>
                                {content.platforms?.map((p: string) => (
                                    <Tag key={p} style={{ fontSize: 13, padding: '4px 12px' }} color="blue">{p.toUpperCase()}</Tag>
                                )) || <Text type="secondary">No platform assigned</Text>}
                            </Space>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title={<span style={{ fontWeight: 600 }}>Stakeholder Summary</span>} style={{ borderRadius: 12, height: '100%' }}>
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>CURRENT PIPELINE STEP</Text>
                                <Text strong style={{ fontSize: 16, color: '#FF6584' }}>
                                    {content.currentStage.toUpperCase()}
                                </Text>
                            </div>
                            
                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>ROUNDS OF REVISION</Text>
                                <Text strong style={{ fontSize: 16 }}>{content.approvalData?.totalRevisions || 0}</Text>
                            </div>

                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>APPROVAL STATUS</Text>
                                <Tag color={
                                    content.approvalData?.status === 'approved' ? 'success' :
                                    content.approvalData?.status === 'pending_review' ? 'warning' :
                                    content.approvalData?.status === 'revision_requested' ? 'error' : 'default'
                                } style={{ fontSize: 13, padding: '2px 8px', marginTop: 4 }}>
                                    {content.approvalData?.status?.replace('_', ' ').toUpperCase() || 'NOT SUBMITTED'}
                                </Tag>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
