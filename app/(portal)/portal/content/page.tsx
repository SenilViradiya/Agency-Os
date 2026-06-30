'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Badge, Card, Select, Typography, Space, Spin, Button, Flex, Tag } from 'antd';
import { CalendarOutlined, UnorderedListOutlined, TableOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PortalContentCalendarPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [contentItems, setContentItems] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            apiClient.get('/api/portal/projects'),
            apiClient.get('/api/portal/content')
        ])
        .then(([projectsRes, contentRes]) => {
            if (projectsRes.data?.success) setProjects(projectsRes.data.data);
            if (contentRes.data?.success) setContentItems(contentRes.data.data);
        })
        .catch(err => {
            console.error('Failed to load content items', err);
        })
        .finally(() => {
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading calendar deliverables..." />
            </div>
        );
    }

    // Filter content items by project
    const filteredContent = contentItems.filter(item => {
        if (selectedProject === 'all') return true;
        return item.projectId === selectedProject;
    });

    const getListData = (value: dayjs.Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        return filteredContent.filter(item => {
            if (!item.plannedPublishDate) return false;
            return dayjs(item.plannedPublishDate).format('YYYY-MM-DD') === dateStr;
        });
    };

    const dateCellRender = (value: dayjs.Dayjs) => {
        const listData = getListData(value);
        return (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '80px', overflowY: 'auto' }}>
                {listData.map(item => (
                    <li key={item._id} style={{ marginBottom: 4 }}>
                        <Badge 
                            status={item.status === 'published' ? 'success' : 'processing'} 
                            text={
                                <span 
                                    style={{ 
                                        fontSize: '11px', 
                                        fontWeight: 500, 
                                        cursor: 'pointer',
                                        color: item.status === 'published' ? '#52c41a' : '#FF6584' 
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/portal/content/${item._id}`);
                                    }}
                                >
                                    {item.title}
                                </span>
                            } 
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const cellRender = (current: dayjs.Dayjs, info: any) => {
        if (info.type === 'date') return dateCellRender(current);
        return info.originNode;
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Content Calendar</Title>
                <Text type="secondary">View and track planned content publish dates and pipeline stages.</Text>
            </div>

            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Space size={16} align="center">
                        <Text strong>Filter by Project:</Text>
                        <Select 
                            value={selectedProject} 
                            onChange={setSelectedProject} 
                            style={{ width: 250 }}
                            placeholder="Select Project"
                        >
                            <Option value="all">All Projects</Option>
                            {projects.map(proj => (
                                <Option key={proj._id} value={proj._id}>{proj.name}</Option>
                            ))}
                        </Select>
                    </Space>
                    
                    <Space>
                        <Button 
                            type={viewMode === 'calendar' ? 'primary' : 'default'} 
                            icon={<TableOutlined />}
                            onClick={() => setViewMode('calendar')}
                            style={{
                                backgroundColor: viewMode === 'calendar' ? '#FF6584' : undefined,
                                borderColor: viewMode === 'calendar' ? '#FF6584' : undefined
                            }}
                        >
                            Calendar View
                        </Button>
                        <Button 
                            type={viewMode === 'list' ? 'primary' : 'default'} 
                            icon={<UnorderedListOutlined />}
                            onClick={() => setViewMode('list')}
                            style={{
                                backgroundColor: viewMode === 'list' ? '#FF6584' : undefined,
                                borderColor: viewMode === 'list' ? '#FF6584' : undefined
                            }}
                        >
                            List View
                        </Button>
                    </Space>
                </Flex>
            </Card>

            {viewMode === 'calendar' ? (
                <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 12 }}>
                    <Calendar cellRender={cellRender} />
                </Card>
            ) : (
                <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    {filteredContent.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <Text type="secondary">No content items found for this selection.</Text>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filteredContent.map(item => (
                                <div 
                                    key={item._id} 
                                    style={{ 
                                        padding: '16px', 
                                        background: '#fafafa', 
                                        borderRadius: 8, 
                                        cursor: 'pointer',
                                        border: '1px solid #f0f0f0' 
                                    }}
                                    onClick={() => router.push(`/portal/content/${item._id}`)}
                                >
                                    <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                                        <Space direction="vertical" size={4}>
                                            <Title level={5} style={{ margin: 0, fontWeight: 700 }}>{item.title}</Title>
                                            <Space wrap>
                                                <Tag color="purple">{item.contentType.replace('_', ' ').toUpperCase()}</Tag>
                                                <Tag color="blue">{item.currentStage.toUpperCase()}</Tag>
                                                {item.platforms.map((p: string) => (
                                                    <Tag key={p} style={{ margin: 0 }}>{p.toUpperCase()}</Tag>
                                                ))}
                                            </Space>
                                        </Space>
                                        <div style={{ textAlign: 'right' }}>
                                            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Planned Publish Date</Text>
                                            <Text strong style={{ fontSize: 14 }}>
                                                {item.plannedPublishDate ? dayjs(item.plannedPublishDate).format('DD MMM YYYY') : 'Not scheduled'}
                                            </Text>
                                        </div>
                                    </Flex>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
export const dynamic = 'force-dynamic';
