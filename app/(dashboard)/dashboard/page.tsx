'use client';

import { Row, Col, Card, Typography, Flex, Space, Tag } from 'antd';
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
        contentInProduction: 0,
    });
    const [myTasks, setMyTasks] = useState<any[]>([]);
    const [pipelineStats, setPipelineStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            apiClient.get('/users?limit=1'),
            apiClient.get('/projects?limit=1'),
            apiClient.get('/tasks?status=todo,in_progress&limit=100'),
            apiClient.get('/content?status=in_production&limit=100'),
        ]).then(([users, projects, tasks, content]) => {
            setStats({
                totalUsers: users.data.pagination?.total || 0,
                activeProjects: projects.data.pagination?.total || 0,
                pendingTasks: tasks.data.pagination?.total || 0,
                contentInProduction: content.data.pagination?.total || 0,
            });
            
            // Filter my tasks
            const userTasks = tasks.data.data.slice(0, 5);
            setMyTasks(userTasks);

            // Calculate pipeline stats
            const counts: any = {};
            content.data.data.forEach((c: any) => {
                counts[c.currentStage] = (counts[c.currentStage] || 0) + 1;
            });
            setPipelineStats(counts);
        }).finally(() => setLoading(false));
    }, []);

    const pipelineStages = [
        { key: 'script', color: 'blue' },
        { key: 'shoot', color: 'orange' },
        { key: 'edit', color: 'purple' },
        { key: 'thumbnail', color: 'magenta' },
        { key: 'caption', color: 'cyan' },
        { key: 'approval', color: 'gold' },
        { key: 'publish', color: 'green' },
    ];

    return (
        <div>
            <PageHeader
                title="Dashboard Overview"
                subtitle="Welcome back to AgencyOS. Here is what's happening today."
            />

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Total Team Members" value={stats.totalUsers} icon={<UserOutlined />} color="#6C63FF" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="Active Projects" value={stats.activeProjects} icon={<ProjectOutlined />} color="#52c41a" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="My Pending Tasks" value={stats.pendingTasks} icon={<CheckSquareOutlined />} color="#faad14" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <StatCard title="In Production" value={stats.contentInProduction} icon={<DollarCircleOutlined />} color="#eb2f96" />
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card 
                        title={<Text strong style={{ fontSize: 16 }}>My Tasks Today</Text>} 
                        style={{ borderRadius: 12, height: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        extra={<Link href="/tasks">View All</Link>}
                    >
                        <Flex vertical gap={12}>
                            {myTasks.length > 0 ? myTasks.map((task: any) => (
                                <Flex key={task._id} align="center" justify="space-between" style={{ padding: '8px 4px', borderBottom: '1px solid #f0f0f0' }}>
                                    <Space orientation="vertical" size={0}>
                                        <Text strong style={{ fontSize: 13 }}>{task.title}</Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{task.taskNumber} • {task.entityType.toUpperCase()}</Text>
                                    </Space>
                                    <Space>
                                        <Tag color={task.priority === 'urgent' ? 'red' : 'blue'}>{task.priority.toUpperCase()}</Tag>
                                        <Tag color="orange">TODO</Tag>
                                    </Space>
                                </Flex>
                            )) : (
                                <Flex vertical align="center" justify="center" style={{ height: '300px' }}>
                                    <Text type="secondary">No tasks assigned for today.</Text>
                                </Flex>
                            )}
                        </Flex>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card 
                        title={<Text strong style={{ fontSize: 16 }}>Content Pipeline Overview</Text>} 
                        style={{ borderRadius: 12, height: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        extra={<Link href="/content">Planner</Link>}
                    >
                        <Row gutter={[16, 16]}>
                            {pipelineStages.map(stage => (
                                <Col span={8} key={stage.key}>
                                    <Card size="small" styles={{ body: { padding: 12, textAlign: 'center' } }} style={{ borderRadius: 8, border: 'none', background: '#fafafa' }}>
                                        <Text strong style={{ fontSize: 18, color: `var(--ant-${stage.color}-6)`, display: 'block' }}>
                                            {pipelineStats[stage.key] || 0}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase' }}>{stage.key}</Text>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Items currently flowing through production.</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
