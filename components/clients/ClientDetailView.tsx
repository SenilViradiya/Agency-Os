'use client';

import { useState } from 'react';
import {
    Row,
    Col,
    Card,
    Typography,
    Tabs,
    Divider,
    Button,
    Avatar,
    Tag,
    List,
    Space,
    Flex,
    Tooltip,
    Progress,
} from 'antd';
import {
    EditOutlined,
    ProjectOutlined,
    DollarCircleOutlined,
    CalendarOutlined,
    InstagramOutlined,
    YoutubeOutlined,
    LinkedinOutlined,
    TwitterOutlined,
    GlobalOutlined,
    UserOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Title, Text, Link } = Typography;

interface ClientDetailViewProps {
    client: any;
    onEdit: () => void;
}

export default function ClientDetailView({ client, onEdit }: ClientDetailViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('1');

    const contractEnd = client.contractEndDate ? dayjs(client.contractEndDate) : null;
    const daysRemaining = contractEnd ? contractEnd.diff(dayjs(), 'days') : Infinity;

    const getRemainingDaysColor = () => {
        if (daysRemaining > 90) return '#52c41a';
        if (daysRemaining > 30) return '#faad14';
        return '#ff4d4f';
    };

    const overviewContent = (
        <Row gutter={24}>
            <Col xs={24} md={16}>
                <Card title={<Text strong>General Information</Text>} style={{ borderRadius: 12 }}>
                    <Row gutter={[40, 32]}>
                        <Col span={12}>
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <InfoItem label="Contact Person" value={client.contactPerson} />
                                <InfoItem label="Email" value={client.email} />
                                <InfoItem label="Phone" value={client.phone} />
                                <InfoItem label="WhatsApp" value={client.whatsappNumber || '-'} />
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <InfoItem label="Industry" value={client.industry || '-'} />
                                <InfoItem label="Website" value={client.website} isLink />
                                <InfoItem label="Contract Start" value={client.contractStartDate ? dayjs(client.contractStartDate).format('DD MMM YYYY') : '-'} />
                                <InfoItem label="Contract End" value={client.contractEndDate ? dayjs(client.contractEndDate).format('DD MMM YYYY') : '-'} />
                            </Space>
                        </Col>
                    </Row>
                    <Divider />
                    <div>
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 12, textTransform: 'uppercase' }}>
                            Services Included
                        </Text>
                        <Flex wrap="wrap" gap={8}>
                            {client.services?.map((s: string) => <Tag key={s} style={{ borderRadius: 4 }}>{s}</Tag>)}
                        </Flex>
                    </div>
                </Card>
            </Col>

            <Col xs={24} md={8}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Card title={<Text strong>Assigned Team</Text>} style={{ borderRadius: 12 }}>
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 12, textTransform: 'uppercase' }}>
                            Account Manager
                        </Text>
                        <Flex gap={12} align="center" style={{ marginBottom: 24 }}>
                            <Avatar size={48} src={client.assignedManager?.avatar}>
                                {client.assignedManager?.name?.charAt(0)}
                            </Avatar>
                            <div>
                                <Text strong style={{ display: 'block' }}>{client.assignedManager?.name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{client.assignedManager?.email}</Text>
                            </div>
                        </Flex>
                        
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 12, textTransform: 'uppercase' }}>
                            Team Members ({client.assignedTeam?.length || 0})
                        </Text>
                        <Avatar.Group maxCount={5}>
                            {client.assignedTeam?.map((member: any) => (
                                <Tooltip key={member._id} title={member.name}>
                                    <Avatar src={member.avatar}>{member.name.charAt(0)}</Avatar>
                                </Tooltip>
                            ))}
                        </Avatar.Group>
                    </Card>

                    <Card title={<Text strong>Social Presence</Text>} style={{ borderRadius: 12 }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <SocialLink icon={<InstagramOutlined />} label="Instagram" value={client.socialHandles?.instagram} />
                            <YoutubeOutlined />
                            <SocialLink icon={<YoutubeOutlined />} label="YouTube" value={client.socialHandles?.youtube} />
                            <LinkedinOutlined />
                            <SocialLink icon={<LinkedinOutlined />} label="LinkedIn" value={client.socialHandles?.linkedin} />
                            <TwitterOutlined />
                            <SocialLink icon={<TwitterOutlined />} label="Twitter / X" value={client.socialHandles?.twitter} />
                        </Space>
                    </Card>
                </Space>
            </Col>
        </Row>
    );

    const projectsContent = (
        <Card style={{ borderRadius: 12 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Project History</Title>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => router.push(`/projects?clientId=${client._id}&drawer=new`)}
                >
                    New Project
                </Button>
            </Flex>
            <List
                dataSource={client.projects}
                renderItem={(project: any) => (
                    <Card 
                        size="small" 
                        hoverable 
                        style={{ marginBottom: 12, borderRadius: 8 }}
                        onClick={() => router.push(`/projects/${project._id}`)}
                    >
                        <Row align="middle" gutter={16}>
                            <Col span={1}>
                                <ProjectOutlined style={{ fontSize: 20, color: project.type === 'retainer' ? '#1890ff' : '#faad14' }} />
                            </Col>
                            <Col span={10}>
                                <Space direction="vertical" size={0}>
                                    <Space>
                                        <Text strong>{project.name}</Text>
                                        <Tag color={project.type === 'retainer' ? 'blue' : 'orange'} style={{ fontSize: 10, textTransform: 'capitalize' }}>
                                            {project.type}
                                        </Tag>
                                        <StatusChip status={project.status} />
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        #{project.projectNumber} • Deadline: {project.deadline ? dayjs(project.deadline).format('DD MMM YYYY') : 'N/A'}
                                    </Text>
                                </Space>
                            </Col>
                            <Col span={8}>
                                <Flex align="center" gap={12}>
                                    <Text style={{ fontSize: 12, minWidth: 40 }}>{project.completionPercentage}%</Text>
                                    <Progress percent={project.completionPercentage} size="small" showInfo={false} />
                                </Flex>
                            </Col>
                        </Row>
                    </Card>
                )}
                locale={{ emptyText: <Text type="secondary">No projects found for this client.</Text> }}
            />
        </Card>
    );

    const tabItems = [
        { key: '1', label: 'Overview', children: overviewContent },
        { key: '2', label: 'Projects', children: projectsContent },
        { key: '3', label: 'Activity', children: <div style={{ padding: 40, textAlign: 'center' }}><Text type="secondary">Activity coming soon...</Text></div> },
    ];

    return (
        <div>
            {/* Header Section */}
            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
                    <Flex gap={24} align="center">
                        <Avatar 
                            src={client.logo} 
                            shape="square" 
                            size={80} 
                            style={{ backgroundColor: '#6C63FF', borderRadius: 12 }}
                        >
                            {client.businessName.charAt(0)}
                        </Avatar>
                        <div>
                            <Flex gap={12} align="center" style={{ marginBottom: 8 }}>
                                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{client.businessName}</Title>
                                <Tag color={client.tier === 'enterprise' ? 'gold' : client.tier === 'premium' ? 'purple' : 'default'} style={{ fontWeight: 800, textTransform: 'capitalize' }}>
                                    {client.tier}
                                </Tag>
                            </Flex>
                            <Flex gap={16} align="center">
                                <StatusChip status={client.status} />
                                <Text type="secondary">
                                    {client.clientNumber} • Part since {dayjs(client.createdAt).format('MMM YYYY')}
                                </Text>
                            </Flex>
                        </div>
                    </Flex>
                    <Button icon={<EditOutlined />} onClick={onEdit} size="large">
                        Edit Client
                    </Button>
                </Flex>

                <Row gutter={16}>
                    <Col xs={12} md={6}>
                        <StatCard 
                            label="Active Projects" 
                            value={client.projects?.filter((p: any) => p.status === 'active').length || 0} 
                            icon={<ProjectOutlined style={{ color: '#1890ff' }} />} 
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <StatCard 
                            label="Total Revenue" 
                            value={`₹${client.totalRevenue?.toLocaleString('en-IN')}`} 
                            icon={<DollarCircleOutlined style={{ color: '#52c41a' }} />} 
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <StatCard 
                            label="Monthly Retainer" 
                            value={`₹${client.monthlyRetainerValue?.toLocaleString('en-IN')}`} 
                            icon={<DollarCircleOutlined style={{ color: '#13c2c2' }} />} 
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <StatCard 
                            label="Contract Remaining" 
                            value={daysRemaining === Infinity ? 'Lifetime' : `${daysRemaining} Days`} 
                            icon={<CalendarOutlined style={{ color: getRemainingDaysColor() }} />}
                            valueColor={getRemainingDaysColor()}
                        />
                    </Col>
                </Row>
            </Card>

            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </div>
    );
}

function StatCard({ label, value, icon, valueColor }: any) {
    return (
        <div style={{ backgroundColor: '#fcfcfc', padding: '16px 20px', borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <Flex align="center" gap={16}>
                <div style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex' }}>
                    {icon}
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block' }}>{label}</Text>
                    <Text strong style={{ fontSize: 18, color: valueColor || 'inherit' }}>{value}</Text>
                </div>
            </Flex>
        </div>
    );
}

function InfoItem({ label, value, isLink }: any) {
    return (
        <div>
            <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>
                {label}
            </Text>
            {isLink && value ? (
                <Link href={value} target="_blank" style={{ fontWeight: 700, fontSize: 15 }}>{value}</Link>
            ) : (
                <Text strong style={{ fontSize: 15 }}>{value || '-'}</Text>
            )}
        </div>
    );
}

function SocialLink({ icon, label, value }: any) {
    const isConnected = !!value;
    return (
        <Flex gap={12} align="center">
            <div style={{ color: isConnected ? '#1890ff' : '#bfbfbf', fontSize: 18, display: 'flex' }}>
                {icon}
            </div>
            <Text style={{ fontWeight: isConnected ? 700 : 400, color: isConnected ? 'inherit' : '#bfbfbf', fontSize: 13 }}>
                {isConnected ? value : `${label} not connected`}
            </Text>
        </Flex>
    );
}
