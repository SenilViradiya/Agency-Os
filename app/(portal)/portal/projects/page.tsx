'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tabs, Progress, Tag, Space, Button, Spin, Empty, Flex } from 'antd';
import { ProjectOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function PortalProjectsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        setLoading(true);
        apiClient.get('/api/portal/projects')
            .then(res => {
                if (res.data?.success) {
                    setProjects(res.data.data);
                }
            })
            .catch(err => {
                console.error('Failed to load projects list', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading your projects..." />
            </div>
        );
    }

    const filteredProjects = projects.filter(p => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return p.status === 'active';
        if (activeTab === 'completed') return p.status === 'completed';
        return true;
    });

    const tabItems = [
        { key: 'all', label: 'All Projects' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Your Projects</Title>
                <Text type="secondary">Monitor progress, milestones, and deliverable quotas.</Text>
            </div>

            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                items={tabItems} 
                style={{ marginBottom: 24 }}
            />

            {filteredProjects.length === 0 ? (
                <Empty description={`No ${activeTab === 'all' ? '' : activeTab} projects found.`} />
            ) : (
                <Row gutter={[20, 20]}>
                    {filteredProjects.map((proj) => (
                        <Col xs={24} sm={12} lg={8} key={proj._id}>
                            <Card
                                hoverable
                                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                                styles={{ body: { padding: '24px' } }}
                            >
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    <Flex justify="space-between" align="start">
                                        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{proj.name}</Title>
                                        <Tag color={proj.type === 'retainer' ? 'cyan' : 'purple'}>{proj.type.toUpperCase()}</Tag>
                                    </Flex>

                                    <Space size={8}>
                                        <Tag color={
                                            proj.status === 'active' ? 'success' :
                                            proj.status === 'completed' ? 'blue' : 'warning'
                                        }>{proj.status.toUpperCase()}</Tag>
                                        <Text type="secondary" style={{ fontSize: 11 }}>#{proj.projectNumber}</Text>
                                    </Space>

                                    <Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }} ellipsis={{ rows: 2 }}>
                                        {proj.description || 'No description provided.'}
                                    </Paragraph>

                                    <div>
                                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Overall Completion</Text>
                                            <Text strong style={{ fontSize: 13 }}>{proj.completionPercentage}%</Text>
                                        </Flex>
                                        <Progress percent={proj.completionPercentage} showInfo={false} strokeColor="#FF6584" />
                                    </div>

                                    <Row gutter={8} style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>START DATE</Text>
                                            <Text strong style={{ fontSize: 12 }}>{dayjs(proj.startDate).format('DD MMM YYYY')}</Text>
                                        </Col>
                                        <Col span={12}>
                                            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>END DATE</Text>
                                            <Text strong style={{ fontSize: 12 }}>
                                                {proj.endDate ? dayjs(proj.endDate).format('DD MMM YYYY') : 'Ongoing (Retainer)'}
                                            </Text>
                                        </Col>
                                    </Row>

                                    <Button 
                                        type="primary" 
                                        block
                                        onClick={() => router.push(`/portal/projects/${proj._id}`)}
                                        style={{
                                            height: 40,
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            backgroundColor: '#FF6584',
                                            borderColor: '#FF6584'
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
}
export const dynamic = 'force-dynamic';
