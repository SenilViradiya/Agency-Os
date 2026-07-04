'use client';

import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Typography, Tabs, Table, Progress, Tag, Space, Spin, Button, Flex } from 'antd';
import { ArrowLeftOutlined, VideoCameraOutlined, CheckCircleOutlined, SyncOutlined, HourglassOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface PortalProjectDetailProps {
    id: string;
}

export default function PortalProjectDetail({ id }: PortalProjectDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projectData, setProjectData] = useState<any>(null);
    const [contentItems, setContentItems] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            apiClient.get(`/portal/projects/${id}`),
            apiClient.get(`/portal/content?projectId=${id}`),
        ])
        .then(([projectRes, contentRes]) => {
            if (projectRes.data?.success) {
                setProjectData(projectRes.data.data);
            }
            if (contentRes.data?.success) {
                setContentItems(contentRes.data.data);
            }
        })
        .catch(err => {
            console.error('Failed to load project details', err);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading project details..." />
            </div>
        );
    }

    if (!projectData) {
        return (
            <Card style={{ margin: 24, textAlign: 'center' }}>
                <Title level={4}>Access Denied or Project Not Found</Title>
                <Text type="secondary">This project does not exist or you do not have permission to view it.</Text>
                <div style={{ marginTop: 24 }}>
                    <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push('/portal/projects')}>
                        Back to Projects
                    </Button>
                </div>
            </Card>
        );
    }

    const { project, summary } = projectData;

    const contentColumns = [
        {
            title: 'Content Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <span 
                    style={{ fontWeight: 600, color: '#FF6584', cursor: 'pointer' }}
                    onClick={() => router.push(`/portal/content/${record._id}`)}
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Content Type',
            dataIndex: 'contentType',
            key: 'contentType',
            render: (type: string) => <Tag color="purple">{type.replace('_', ' ').toUpperCase()}</Tag>
        },
        {
            title: 'Platform',
            dataIndex: 'platforms',
            key: 'platforms',
            render: (platforms: string[]) => (
                <Space size={4}>
                    {platforms.map(p => <Tag key={p} style={{ margin: 0 }}>{p.toUpperCase()}</Tag>)}
                </Space>
            )
        },
        {
            title: 'Current Stage',
            dataIndex: 'currentStage',
            key: 'currentStage',
            render: (stage: string) => <Tag color="blue">{stage.toUpperCase()}</Tag>
        },
        {
            title: 'Publish Link',
            dataIndex: ['publishData', 'publishedUrl'],
            key: 'publishedUrl',
            render: (url: string, record: any) => {
                const actualUrl = url || record.publishData?.publishedUrl;
                return actualUrl ? (
                    <a href={actualUrl} target="_blank" rel="noreferrer" style={{ color: '#52c41a', fontWeight: 600 }}>
                        Open URL
                    </a>
                ) : (
                    <Text type="secondary">—</Text>
                );
            }
        },
        {
            title: 'Target Date',
            dataIndex: 'plannedPublishDate',
            key: 'plannedPublishDate',
            render: (date: any) => date ? dayjs(date).format('DD MMM YYYY') : <Text type="secondary">—</Text>
        },
        {
            title: 'Revisions',
            dataIndex: 'totalRevisions',
            key: 'totalRevisions',
            render: (revisions: number) => <Tag>{revisions || 0} Revisions</Tag>
        }
    ];

    const quotaItems = project.contentQuota ? Object.entries(project.contentQuota).filter(([_, val]) => (val as number) > 0) : [];

    const tabItems = [
        {
            key: 'overview',
            label: 'Overview',
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 12 }}>
                    <Card title={<span style={{ fontWeight: 600 }}>Project Description & Details</span>} style={{ borderRadius: 12 }}>
                        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{project.description || 'No description provided.'}</Paragraph>
                        
                        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                            <Col xs={12} sm={6}>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>START DATE</Text>
                                <Text strong>{dayjs(project.startDate).format('DD MMM YYYY')}</Text>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>END DATE</Text>
                                <Text strong>{project.endDate ? dayjs(project.endDate).format('DD MMM YYYY') : 'Ongoing (Retainer)'}</Text>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>DEADLINE</Text>
                                <Text strong>{project.deadline ? dayjs(project.deadline).format('DD MMM YYYY') : 'Not applicable'}</Text>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>PROJECT VALUE TYPE</Text>
                                <Tag color={project.type === 'retainer' ? 'cyan' : 'purple'}>{project.type.toUpperCase()}</Tag>
                            </Col>
                        </Row>
                    </Card>

                    {project.type === 'retainer' && quotaItems.length > 0 && (
                        <Card title={<span style={{ fontWeight: 600 }}>Active Deliverables Quota</span>} style={{ borderRadius: 12 }}>
                            <Row gutter={[16, 16]}>
                                {quotaItems.map(([key, val]: any) => (
                                    <Col xs={12} sm={8} md={6} key={key}>
                                        <div style={{ padding: '16px', background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                                            <Title level={4} style={{ margin: 0, color: '#6C63FF' }}>{val}</Title>
                                            <Text type="secondary" style={{ textTransform: 'capitalize', fontSize: 12 }}>{key.replace('Videos', ' Videos')}</Text>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}

                    <Card title={<span style={{ fontWeight: 600 }}>Platforms & Scope</span>} style={{ borderRadius: 12 }}>
                        <Space direction="vertical" size={16}>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>TARGET PLATFORMS</Text>
                                <Space size={8}>
                                    {project.platforms?.map((p: string) => (
                                        <Tag key={p} style={{ fontSize: 13, padding: '4px 12px' }} color="blue">{p.toUpperCase()}</Tag>
                                    )) || 'No platforms selected.'}
                                </Space>
                            </div>
                            <div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>INCLUDED SERVICES</Text>
                                <Space size={8} wrap>
                                    {project.services?.map((s: string) => (
                                        <Tag key={s} style={{ fontSize: 13, padding: '4px 12px' }} color="purple">{s}</Tag>
                                    )) || 'No services listed.'}
                                </Space>
                            </div>
                        </Space>
                    </Card>
                </div>
            )
        },
        {
            key: 'content',
            label: `Content Items (${contentItems.length})`,
            children: (
                <div style={{ marginTop: 12 }}>
                    <Table 
                        dataSource={contentItems} 
                        columns={contentColumns} 
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                        style={{ borderRadius: 12, overflow: 'hidden' }}
                    />
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push('/portal/projects')} style={{ paddingLeft: 0, color: '#FF6584' }}>
                    Back to Projects List
                </Button>
            </div>

            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size={4}>
                            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{project.name}</Title>
                            <Space>
                                <Text type="secondary">Project ID: #{project.projectNumber}</Text>
                                <span style={{ color: '#d9d9d9' }}>|</span>
                                <Tag color={
                                    project.status === 'active' ? 'success' :
                                    project.status === 'completed' ? 'blue' : 'warning'
                                }>{project.status.toUpperCase()}</Tag>
                            </Space>
                        </Space>
                    </Col>
                    <Col xs={24} md={8}>
                        <Flex vertical align="end">
                            <Text strong style={{ fontSize: 14, marginBottom: 4 }}>Completion Progress</Text>
                            <Progress percent={project.completionPercentage} strokeColor="#FF6584" style={{ width: '100%', maxWidth: 250 }} />
                        </Flex>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card style={{ textAlign: 'center', borderRadius: 12 }} styles={{ body: { padding: '16px' } }}>
                        <Space direction="vertical" size={2}>
                            <VideoCameraOutlined style={{ fontSize: 20, color: '#6C63FF' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>TOTAL CONTENT</Text>
                            <Title level={4} style={{ margin: 0 }}>{summary.totalContent}</Title>
                        </Space>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ textAlign: 'center', borderRadius: 12 }} styles={{ body: { padding: '16px' } }}>
                        <Space direction="vertical" size={2}>
                            <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>PUBLISHED</Text>
                            <Title level={4} style={{ margin: 0 }}>{summary.published}</Title>
                        </Space>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ textAlign: 'center', borderRadius: 12 }} styles={{ body: { padding: '16px' } }}>
                        <Space direction="vertical" size={2}>
                            <SyncOutlined style={{ fontSize: 20, color: '#faad14' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>IN PRODUCTION</Text>
                            <Title level={4} style={{ margin: 0 }}>{summary.inProduction}</Title>
                        </Space>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ textAlign: 'center', borderRadius: 12 }} styles={{ body: { padding: '16px' } }}>
                        <Space direction="vertical" size={2}>
                            <HourglassOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>ON HOLD / PLANNED</Text>
                            <Title level={4} style={{ margin: 0 }}>{summary.planned}</Title>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Tabs defaultActiveKey="overview" items={tabItems} />
        </div>
    );
}
