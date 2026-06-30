'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Flex, Space, Tag, Progress, Spin, Button } from 'antd';
import {
    ProjectOutlined,
    VideoCameraOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    RightOutlined
} from '@ant-design/icons';
import { usePortal } from './PortalContext';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Title, Text, Link, Paragraph } = Typography;

const StatCard = ({ title, value, icon, color, isNegative = false }: any) => (
    <Card 
        styles={{ body: { padding: '20px' } }} 
        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
    >
        <Flex align="center" gap={12}>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                fontSize: '20px'
            }}>
                {icon}
            </div>
            <div>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 12, display: 'block' }}>
                    {title}
                </Text>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: isNegative ? '#fa8c16' : undefined }}>
                    {value}
                </Title>
            </div>
        </Flex>
    </Card>
);

export default function PortalDashboard() {
    const { user, client } = usePortal();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [content, setContent] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            apiClient.get('/api/portal/projects'),
            apiClient.get('/api/portal/content'),
            apiClient.get('/api/portal/invoices')
        ]).then(([projectsRes, contentRes, invoicesRes]) => {
            if (projectsRes.data?.success) setProjects(projectsRes.data.data);
            if (contentRes.data?.success) setContent(contentRes.data.data);
            if (invoicesRes.data?.success) setInvoices(invoicesRes.data.data);
        }).catch(err => {
            console.error('Failed to load portal stats', err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Aggregating overview..." />
            </div>
        );
    }

    // 1. Calculate active projects
    const activeProjects = projects.filter(p => p.status === 'active').length;

    // 2. Count content in production (not yet published/completed)
    const contentInProduction = content.filter(c => 
        ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish'].includes(c.currentStage) &&
        c.status !== 'published' && c.status !== 'cancelled'
    ).length;

    // 3. Count published content this month
    const startOfMonth = dayjs().startOf('month');
    const contentPublishedThisMonth = content.filter(c => {
        return c.status === 'published' && c.plannedPublishDate && dayjs(c.plannedPublishDate).isAfter(startOfMonth);
    }).length;

    // 4. Outstanding invoice amount helper
    const outstandingAmount = invoices
        .filter(inv => ['sent', 'partially_paid', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

    // Filter next 5 planned content items
    const upcomingContent = content
        .filter(c => c.status !== 'published' && c.status !== 'cancelled' && c.plannedPublishDate)
        .sort((a,b) => dayjs(a.plannedPublishDate).diff(dayjs(b.plannedPublishDate)))
        .slice(0, 5);

    // Filter last 3 invoices
    const recentInvoices = invoices.slice(0, 3);

    // Format currency to Indian Rupee (₹) format
    const formatCurrency = (val: number) => {
        return `₹${val.toLocaleString('en-IN')}`;
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Welcome back, {user?.name}</Title>
                <Text type="secondary">{client?.businessName} • Client Dashboard</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Active Projects" 
                        value={activeProjects} 
                        icon={<ProjectOutlined />} 
                        color="#6C63FF" 
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Content In Production" 
                        value={contentInProduction} 
                        icon={<VideoCameraOutlined />} 
                        color="#faad14" 
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Published This Month" 
                        value={contentPublishedThisMonth} 
                        icon={<CheckCircleOutlined />} 
                        color="#52c41a" 
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard 
                        title="Outstanding Invoice Balance" 
                        value={formatCurrency(outstandingAmount)} 
                        icon={<DollarCircleOutlined />} 
                        color={outstandingAmount > 0 ? '#fa8c16' : '#8c8c8c'} 
                        isNegative={outstandingAmount > 0}
                    />
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={14}>
                    <Card 
                        title={<span style={{ fontWeight: 600 }}>Upcoming Content</span>} 
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        extra={<Button type="link" onClick={() => router.push('/portal/content')}>Full Calendar</Button>}
                    >
                        {upcomingContent.length === 0 ? (
                            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8c8c8c' }}>
                                No upcoming content scheduled.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {upcomingContent.map((item) => (
                                    <div 
                                        key={item._id} 
                                        style={{ 
                                            padding: '12px', 
                                            borderRadius: 8, 
                                            background: '#fafafa',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => router.push(`/portal/content/${item._id}`)}
                                    >
                                        <Flex justify="space-between" align="center">
                                            <Space direction="vertical" size={2}>
                                                <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                                                <Space>
                                                    <Tag color="purple">{item.contentType.replace('_', ' ').toUpperCase()}</Tag>
                                                    <Tag color="blue">{item.currentStage.toUpperCase()}</Tag>
                                                </Space>
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {dayjs(item.plannedPublishDate).format('DD MMM YYYY')}
                                            </Text>
                                        </Flex>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={10}>
                    <Card 
                        title={<span style={{ fontWeight: 600 }}>Recent Invoices</span>} 
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        extra={<Button type="link" onClick={() => router.push('/portal/invoices')}>View All Invoices</Button>}
                    >
                        {recentInvoices.length === 0 ? (
                            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8c8c8c' }}>
                                No recent invoices found.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {recentInvoices.map((inv) => (
                                    <div 
                                        key={inv._id} 
                                        style={{ 
                                            padding: '12px', 
                                            borderRadius: 8, 
                                            background: '#fafafa',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => router.push(`/portal/invoices/${inv._id}`)}
                                    >
                                        <Flex justify="space-between" align="center">
                                            <Space direction="vertical" size={2}>
                                                <Text strong>{inv.invoiceNumber}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    Due: {dayjs(inv.dueDate).format('DD MMM YYYY')}
                                                </Text>
                                            </Space>
                                            <Space>
                                                <Text strong>{formatCurrency(inv.totalAmount)}</Text>
                                                <Tag color={
                                                    inv.status === 'paid' ? 'success' :
                                                    inv.status === 'overdue' ? 'error' : 'warning'
                                                }>{inv.status.replace('_', ' ').toUpperCase()}</Tag>
                                            </Space>
                                        </Flex>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 12 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Your Active Projects</Title>
            </div>

            <Row gutter={[16, 16]}>
                {projects.length === 0 ? (
                    <Col span={24}>
                        <Card style={{ textAlign: 'center', padding: '30px', color: '#555', borderRadius: 12 }}>
                            No projects currently set up. Contact your agency.
                        </Card>
                    </Col>
                ) : (
                    projects.map((proj) => (
                        <Col xs={24} sm={12} md={8} key={proj._id}>
                            <Card 
                                hoverable 
                                style={{ borderRadius: 12 }}
                                actions={[
                                    <span key="details" onClick={() => router.push(`/portal/projects/${proj._id}`)}>
                                        View Details <RightOutlined style={{ fontSize: 10 }} />
                                    </span>
                                ]}
                            >
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Flex justify="space-between" align="start">
                                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>{proj.name}</Title>
                                        <Tag color={proj.type === 'retainer' ? 'cyan' : 'purple'}>{proj.type.toUpperCase()}</Tag>
                                    </Flex>
                                    <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }} ellipsis={{ rows: 2 }}>{proj.description}</Paragraph>
                                    <div>
                                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>Completion</Text>
                                            <Text strong style={{ fontSize: 12 }}>{proj.completionPercentage}%</Text>
                                        </Flex>
                                        <Progress percent={proj.completionPercentage} showInfo={false} strokeColor="#FF6584" />
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
        </div>
    );
}
