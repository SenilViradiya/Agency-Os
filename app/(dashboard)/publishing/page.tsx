'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Tabs, 
    Row, 
    Col, 
    Card, 
    Statistic, 
    Flex, 
    Space, 
    Select, 
    Empty, 
    Spin, 
    App as AntdApp,
    Typography,
    DatePicker
} from 'antd';
import { 
    RocketOutlined, 
    CheckCircleOutlined, 
    ClockCircleOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import PublishCard from '@/components/publishing/PublishCard';
import PublishedLog from '@/components/publishing/PublishedLog';
import PublishModal from '@/components/publishing/PublishModal';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function PublishingPage() {
    const { message } = AntdApp.useApp();
    
    const [activeTab, setActiveTab] = useState('ready_to_publish');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [stats, setStats] = useState({ readyCount: 0, publishedThisWeek: 0, publishedThisMonth: 0, totalPublished: 0 });
    
    // Filters
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);

    // Modal States
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [publishModalOpen, setPublishModalOpen] = useState(false);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('status', activeTab);
            if (selectedClient) params.append('clientId', selectedClient);

            const res = await apiClient.get(`/publishing?${params.toString()}`);
            if (res.data.success) {
                setItems(res.data.data);
                
                // If it's the ready tab, update the count
                if (activeTab === 'ready_to_publish') {
                    setStats(prev => ({ ...prev, readyCount: res.data.pagination.total }));
                } else {
                    setStats(prev => ({ ...prev, totalPublished: res.data.pagination.total }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch publishing items:', error);
            message.error('Failed to load publishing queue');
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedClient, message]);

    const fetchFilters = async () => {
        try {
            const res = await apiClient.get('/clients');
            setClients(res.data.data);
        } catch (error) {
            console.error('Failed to fetch filters:', error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        fetchFilters();
    }, []);

    const handlePublish = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/publishing/${selectedItem._id}/publish`, values);
            if (res.data.success) {
                message.success('Content marked as published! ✓');
                setPublishModalOpen(false);
                fetchItems();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to log published content');
        } finally {
            setActionLoading(false);
        }
    };

    const tabItems = [
        { key: 'ready_to_publish', label: `Ready to Publish ${stats.readyCount > 0 ? `(${stats.readyCount})` : ''}` },
        { key: 'published', label: 'Published Log' },
    ];

    return (
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Publishing"
                    subtitle="Track and log content as it goes live across platforms."
                />
            </Flex>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                        <Statistic title="Ready to Publish" value={stats.readyCount} prefix={<ClockCircleOutlined />} styles={{ content: { color: '#1890ff' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                        <Statistic title="Published This Week" value={stats.publishedThisWeek} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#52c41a' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                        <Statistic title="Published This Month" value={stats.publishedThisMonth} prefix={<RocketOutlined />} styles={{ content: { color: '#722ed1' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                        <Statistic title="Total Published" value={stats.totalPublished} prefix={<CalendarOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Card style={{ borderRadius: 12, marginBottom: 24 }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={setActiveTab} 
                        items={tabItems}
                        style={{ marginBottom: 0 }}
                    />
                    
                    <Space wrap>
                        <Select 
                            placeholder="Client" 
                            style={{ width: 160 }} 
                            allowClear 
                            onChange={setSelectedClient}
                        >
                            {clients.map(c => <Option key={c._id} value={c._id}>{c.businessName}</Option>)}
                        </Select>
                        {activeTab === 'published' && <RangePicker style={{ width: 260 }} size="middle" />}
                    </Space>
                </Flex>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
            ) : activeTab === 'ready_to_publish' ? (
                items.length > 0 ? (
                    <div style={{ maxWidth: 1000 }}>
                        {items.map(item => (
                            <PublishCard 
                                key={item._id} 
                                item={item} 
                                onPublish={(item) => { setSelectedItem(item); setPublishModalOpen(true); }}
                            />
                        ))}
                    </div>
                ) : (
                    <Card style={{ borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
                        <Empty 
                            description={
                                <Space orientation="vertical" size={4}>
                                    <Text strong>Everything is published!</Text>
                                    <Text type="secondary">Waiting for new content to be approved.</Text>
                                </Space>
                            } 
                        />
                    </Card>
                )
            ) : (
                <PublishedLog data={items} loading={loading} />
            )}

            <PublishModal
                open={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                onConfirm={handlePublish}
                item={selectedItem}
                loading={actionLoading}
            />
        </div>
    );
}
