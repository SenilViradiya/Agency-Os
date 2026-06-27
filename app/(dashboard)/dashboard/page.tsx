'use client';

import { Row, Col, Card, Typography, Flex, Space } from 'antd';
import PageHeader from '@/components/shared/PageHeader';
import {
    UserOutlined,
    ProjectOutlined,
    CheckSquareOutlined,
    DollarCircleOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

const { Title, Text, Link } = Typography;

const StatCard = ({ title, value, icon, color }: any) => (
    <Card 
        styles={{ body: { padding: '24px' } }} 
        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
    >
        <Flex align="center" gap={16}>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                fontSize: '24px'
            }}>
                {icon}
            </div>
            <div>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 13, display: 'block' }}>
                    {title}
                </Text>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                    {value}
                </Title>
            </div>
        </Flex>
    </Card>
);

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeProjects: 0,
        pendingTasks: 0,
        monthlyRevenue: '₹0'
    });

    useEffect(() => {
        // Fetch users count
        apiClient.get('/users').then(res => {
            if (res.data.success) {
                setStats(prev => ({ ...prev, totalUsers: res.data.data.length }));
            }
        }).catch(() => { });
    }, []);

    return (
        <div>
            <PageHeader
                title="Dashboard Overview"
                subtitle="Welcome back to AgencyOS. Here is what's happening today."
            />

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Total Users" value={stats.totalUsers} icon={<UserOutlined />} color="#6C63FF" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Active Projects" value={stats.activeProjects} icon={<ProjectOutlined />} color="#52c41a" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Pending Tasks" value={stats.pendingTasks} icon={<CheckSquareOutlined />} color="#faad14" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Monthly Revenue" value={stats.monthlyRevenue} icon={<DollarCircleOutlined />} color="#eb2f96" />
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={16}>
                    <Card 
                        title={<Text strong style={{ fontSize: 16 }}>Recent Activity</Text>} 
                        style={{ borderRadius: 12, height: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                        <Flex vertical align="center" justify="center" style={{ height: '280px', backgroundColor: '#fafafa', borderRadius: 12 }}>
                            <Text type="secondary">No recent activity found.</Text>
                        </Flex>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card 
                        title={<Text strong style={{ fontSize: 16 }}>Quick Links</Text>} 
                        style={{ borderRadius: 12, height: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                        <Flex vertical>
                            {[
                                { title: 'Manage Users', link: '/users', status: 'active' },
                                { title: 'Configure Roles', link: '/roles', status: 'active' },
                                { title: 'Add Lead', link: '#', status: 'soon' },
                                { title: 'Create Project', link: '#', status: 'soon' }
                            ].map((item, index) => (
                                <div key={index} style={{ padding: '12px 0' }}>
                                    <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                                        <Space>
                                            <RightOutlined style={{ fontSize: 12, color: item.status === 'active' ? '#6C63FF' : '#bfbfbf' }} />
                                            <Link 
                                                href={item.link}
                                                style={{ color: item.status === 'active' ? '#6C63FF' : 'inherit' }}
                                            >
                                                <Text 
                                                    strong={item.status === 'active'} 
                                                    type={item.status === 'active' ? undefined : 'secondary'}
                                                    style={{ color: item.status === 'active' ? '#6C63FF' : undefined, cursor: item.status === 'active' ? 'pointer' : 'default' }}
                                                >
                                                    {item.title}
                                                </Text>
                                            </Link>
                                        </Space>
                                        {item.status === 'soon' && <Text type="secondary" style={{ fontSize: 11 }}>Soon</Text>}
                                    </Flex>
                                </div>
                            ))}
                        </Flex>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
