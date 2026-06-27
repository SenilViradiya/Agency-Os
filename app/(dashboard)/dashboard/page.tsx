'use client';

import { Row, Col, Card, Typography, Flex, Space, Tag, Avatar, Spin, Divider, Button, Empty } from 'antd';
import PageHeader from '@/components/shared/PageHeader';
import {
    UserOutlined,
    ProjectOutlined,
    CheckSquareOutlined,
    DollarCircleOutlined,
    FileSearchOutlined,
    RocketOutlined,
    FileSyncOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
const { Title, Text, Link } = Typography;

const StatCard = ({ title, value, icon, color }: any) => (
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
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                    {value}
                </Title>
            </div>
        </Flex>
    </Card>
);

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        activeProjects: 0,
        pendingTasks: 0,
        contentInProduction: 0,
        pendingApprovals: 0,
        readyToPublish: 0
    });
    const [myTasks, setMyTasks] = useState<any[]>([]);
    const [pipelineStats, setPipelineStats] = useState<any>({});
    const [recentApprovals, setRecentApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            apiClient.get('/projects?limit=1'),
            apiClient.get('/tasks?status=todo,in_progress&limit=100'),
            apiClient.get('/content?limit=500'),
            apiClient.get('/approvals?limit=5'),
        ]).then(([projects, tasks, content, approvals]) => {
            const allContent = content.data.data;
            
            setStats({
                activeProjects: projects.data.pagination?.total || 0,
                pendingTasks: tasks.data.pagination?.total || 0,
                contentInProduction: allContent.filter((c: any) => c.status === 'in_production').length,
                pendingApprovals: allContent.filter((c: any) => c.approvalData.status === 'pending_review').length,
                readyToPublish: allContent.filter((c: any) => c.publishData.status === 'ready_to_publish').length,
            });
            
            // My Tasks (last 5)
            setMyTasks(tasks.data.data.slice(0, 5));

            // Calculate pipeline stats
            const counts: any = {};
            allContent.forEach((c: any) => {
                counts[c.currentStage] = (counts[c.currentStage] || 0) + 1;
            });
            setPipelineStats(counts);

            // Recent Approvals (mocked from the approval queue data for now or we could have a real activity log)
            // For now let's use the actual approvals queue items that have been reviewed
            const reviewed = allContent
                .filter((c: any) => c.approvalData.status === 'approved' || c.approvalData.status === 'revision_requested')
                .sort((a: any, b: any) => dayjs(b.approvalData.reviewedAt || b.updatedAt).diff(dayjs(a.approvalData.reviewedAt || a.updatedAt)))
                .slice(0, 5);
            setRecentApprovals(reviewed);

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

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;

    return (
        <div>
            <PageHeader
                title="Dashboard Overview"
                subtitle="Welcome back to AgencyOS. Here is what's happening today."
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} lg={4.8} style={{ flexBasis: '20%', maxWidth: '20%' }}>
                    <StatCard title="Active Projects" value={stats.activeProjects} icon={<ProjectOutlined />} color="#52c41a" />
                </Col>
                <Col xs={24} sm={12} lg={4.8} style={{ flexBasis: '20%', maxWidth: '20%' }}>
                    <StatCard title="Pending Tasks" value={stats.pendingTasks} icon={<CheckSquareOutlined />} color="#faad14" />
                </Col>
                <Col xs={24} sm={12} lg={4.8} style={{ flexBasis: '20%', maxWidth: '20%' }}>
                    <StatCard title="In Production" value={stats.contentInProduction} icon={<FileSyncOutlined />} color="#eb2f96" />
                </Col>
                <Col xs={24} sm={12} lg={4.8} style={{ flexBasis: '20%', maxWidth: '20%' }}>
                    <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={<FileSearchOutlined />} color="#f5222d" />
                </Col>
                <Col xs={24} sm={12} lg={4.8} style={{ flexBasis: '20%', maxWidth: '20%' }}>
                    <StatCard title="Ready to Publish" value={stats.readyToPublish} icon={<RocketOutlined />} color="#6C63FF" />
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <Card 
                                title={<Text strong style={{ fontSize: 16 }}>My Priority Tasks</Text>} 
                                style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                                extra={<Link href="/tasks">View All</Link>}
                            >
                                {myTasks.length === 0 ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pending tasks assigned to you." />
                                ) : (
                                    <Flex vertical>
                                        {myTasks.map((task: any) => (
                                            <div key={task._id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                                <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                                                    <Space>
                                                        <div style={{ backgroundColor: '#f0f0f0', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <CheckSquareOutlined style={{ color: '#6C63FF' }} />
                                                        </div>
                                                        <div>
                                                            <Text strong style={{ display: 'block' }}>{task.title}</Text>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{task.taskNumber} • {task.entityType.toUpperCase()}</Text>
                                                        </div>
                                                    </Space>
                                                    <Space>
                                                        <Tag color={task.priority === 'urgent' ? 'red' : 'blue'}>{task.priority.toUpperCase()}</Tag>
                                                        <Tag color="orange">TODO</Tag>
                                                    </Space>
                                                </Flex>
                                            </div>
                                        ))}
                                    </Flex>
                                )}
                            </Card>
                        </Col>
                        <Col span={24}>
                            <Card 
                                title={<Text strong style={{ fontSize: 16 }}>Production Pipeline</Text>} 
                                style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                                extra={<Link href="/content">Planner</Link>}
                            >
                                <Row gutter={16}>
                                    {pipelineStages.map(stage => {
                                        const count = pipelineStats[stage.key] || 0;
                                        return (
                                            <Col xs={12} sm={6} md={stage.key === 'publish' ? 3.4 : 3.4} key={stage.key} style={{ flexGrow: 1 }}>
                                                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fafafa', borderRadius: 12 }}>
                                                    <Title level={3} style={{ margin: 0, color: `var(--ant-${stage.color}-6)`, fontWeight: 800 }}>
                                                        {count}
                                                    </Title>
                                                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        {stage.key}
                                                    </Text>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Col>

                <Col xs={24} lg={8}>
                    <Card 
                        title={<Text strong style={{ fontSize: 16 }}>Approval Activity</Text>} 
                        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        styles={{ body: { padding: '12px 24px' } }}
                    >
                        {recentApprovals.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent approval activity." />
                        ) : (
                            <Flex vertical>
                                {recentApprovals.map((item: any) => (
                                    <div key={item._id} style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 0' }}>
                                        <Flex gap={12} align="start">
                                            <Avatar src={item.approvalData.reviewedBy?.avatar || '/avatar-placeholder.png'} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13 }}>
                                                    <Text strong>{item.approvalData.reviewedBy?.name || 'Manager'}</Text>{' '}
                                                    <Text type="secondary">
                                                        {item.approvalData.status === 'approved' ? 'approved ✓' : 'requested revision ↩ on'}
                                                    </Text>{' '}
                                                    <Link href={`/content/${item._id}`} strong>{item.title}</Link>
                                                </div>
                                                <Flex gap={8} align="center" style={{ fontSize: 11, marginTop: 4 }}>
                                                    <Text type="secondary">{dayjs(item.approvalData.reviewedAt || item.updatedAt).fromNow()}</Text>
                                                    <span style={{ color: '#f0f0f0' }}>|</span>
                                                    {item.approvalData.status === 'approved' ? 
                                                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0, fontSize: 10 }}>Approved</Tag> :
                                                        <Tag icon={<ExclamationCircleOutlined />} color="warning" style={{ margin: 0, fontSize: 10 }}>Revision</Tag>
                                                    }
                                                </Flex>
                                            </div>
                                        </Flex>
                                    </div>
                                ))}
                            </Flex>
                        )}
                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <Button type="link" onClick={() => router.push('/approvals')}>Go to Approval Queue</Button>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
