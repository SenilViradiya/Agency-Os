'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    Typography, 
    Button, 
    Space, 
    Segmented, 
    Flex, 
    Select, 
    App,
    Badge,
    Spin,
    Card,
    DatePicker
} from 'antd';
import { 
    PlusOutlined, 
    CalendarOutlined, 
    UnorderedListOutlined,
    FilterOutlined
} from '@ant-design/icons';
import ContentCalendar from '@/components/content/ContentCalendar';
import ContentTable from '@/components/content/ContentTable';
import ContentDrawer from '@/components/content/ContentDrawer';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export default function ContentPlannerPage() {
    const { message } = App.useApp();
    const router = useRouter();
    
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    
    const [filters, setFilters] = useState({
        projectId: undefined,
        contentType: undefined,
        status: undefined,
    });

    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/content?limit=200`;
            if (view === 'calendar') {
                url += `&month=${currentMonth.format('YYYY-MM')}`;
            }
            if (filters.projectId) url += `&projectId=${filters.projectId}`;
            if (filters.contentType) url += `&contentType=${filters.contentType}`;
            if (filters.status) url += `&status=${filters.status}`;

            const res = await apiClient.get(url);
            if (res.data.success) {
                setItems(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch content:', error);
            message.error('Failed to load content items');
        } finally {
            setLoading(false);
        }
    }, [view, currentMonth, filters, message]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleCreateContent = async (values: any) => {
        try {
            const res = await apiClient.post('/content', values);
            if (res.data.success) {
                message.success('Content item created. Path check task auto-created.');
                setDrawerOpen(false);
                fetchContent();
            }
        } catch (error) {
            message.error('Failed to create content');
        }
    };

    const handleDeleteContent = async (id: string) => {
        try {
            await apiClient.delete(`/content/${id}`);
            message.success('Content item deleted');
            fetchContent();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Delete failed');
        }
    };

    return (
        <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Space size="middle">
                    <Title level={2} style={{ margin: 0 }}>Content Planner <Badge count={items.length} offset={[10, 0]} color="#6C63FF" /></Title>
                </Space>
                <Space>
                    <Segmented
                        options={[
                            { label: <><CalendarOutlined /> Calendar</>, value: 'calendar' },
                            { label: <><UnorderedListOutlined /> List</>, value: 'list' }
                        ]}
                        value={view}
                        onChange={(v) => setView(v as any)}
                        style={{ background: '#f0f0f0', borderRadius: 8 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedItem(null); setDrawerOpen(true); }} size="large">
                        New Content
                    </Button>
                </Space>
            </Flex>

            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Flex gap={16} align="center">
                    <FilterOutlined style={{ color: '#8c8c8c' }} />
                    <DatePicker 
                        picker="month" 
                        value={currentMonth} 
                        onChange={(d) => d && setCurrentMonth(d)} 
                        style={{ width: 150 }}
                    />
                    <Select 
                        placeholder="Content Type" 
                        style={{ width: 150 }} 
                        allowClear
                        onChange={(v) => setFilters({ ...filters, contentType: v })}
                    >
                        <Option value="youtube_video">YouTube Video</Option>
                        <Option value="reel">Instagram Reel</Option>
                        <Option value="short">YouTube Short</Option>
                        <Option value="story">Story</Option>
                    </Select>
                    <Select 
                        placeholder="Status" 
                        style={{ width: 140 }} 
                        allowClear
                        onChange={(v) => setFilters({ ...filters, status: v })}
                    >
                        <Option value="draft">Draft</Option>
                        <Option value="in_production">In Production</Option>
                        <Option value="published">Published</Option>
                    </Select>
                </Flex>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
            ) : view === 'calendar' ? (
                <ContentCalendar 
                    items={items} 
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    onItemClick={(item) => router.push(`/content/${item._id}`)}
                    onAddClick={(date) => {
                        setSelectedItem({ plannedPublishDate: date.toDate() });
                        setDrawerOpen(true);
                    }}
                />
            ) : (
                <ContentTable 
                    items={items} 
                    loading={loading}
                    onEdit={(item) => { setSelectedItem(item); setDrawerOpen(true); }}
                    onDelete={handleDeleteContent}
                    onView={(id) => router.push(`/content/${id}`)}
                />
            )}

            <ContentDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleCreateContent}
                initialData={selectedItem}
                loading={false}
            />
        </div>
    );
}
