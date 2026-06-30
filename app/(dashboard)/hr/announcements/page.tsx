'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Space, Flex, Select, Card, Tag, Avatar, App, Spin, Drawer, Input, Radio, Switch, DatePicker, Row, Col, Empty, Popconfirm,
} from 'antd';
import {
    PlusOutlined, PushpinFilled, ReadOutlined, EditOutlined, DeleteOutlined, NotificationOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
const { Title, Text, Paragraph } = Typography;

const typeColors: Record<string, string> = { general: 'blue', policy: 'purple', holiday: 'green', event: 'magenta', urgent: 'red' };
const priorityColors: Record<string, string> = { low: 'default', medium: 'orange', high: 'red' };

export default function AnnouncementsPage() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingAnn, setEditingAnn] = useState<any>(null);
    const [filters, setFilters] = useState({ type: undefined as string | undefined, priority: undefined as string | undefined });

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<string>('general');
    const [priority, setPriority] = useState<string>('medium');
    const [targetAudience, setTargetAudience] = useState<string>('all');
    const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
    const [isPinned, setIsPinned] = useState(false);
    const [expiresAt, setExpiresAt] = useState<dayjs.Dayjs | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [targetUsers, setTargetUsers] = useState<string[]>([]);

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/hr/announcements';
            const params: string[] = [];
            if (filters.type) params.push(`type=${filters.type}`);
            if (filters.priority) params.push(`priority=${filters.priority}`);
            if (params.length) url += '?' + params.join('&');
            const res = await apiClient.get(url);
            if (res.data.success) setAnnouncements(res.data.data);
        } catch { message.error('Failed to load announcements'); } finally { setLoading(false); }
    }, [filters, message]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await apiClient.get('/users?limit=100');
            if (res.data.success) setUsers(res.data.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchAnnouncements(); fetchUsers(); }, [fetchAnnouncements, fetchUsers]);

    const handleMarkRead = async (annId: string) => {
        try {
            await apiClient.put(`/hr/announcements/${annId}`, { action: 'mark_read' });
            fetchAnnouncements();
        } catch { message.error('Failed to mark as read'); }
    };

    const handleDelete = async (annId: string) => {
        try {
            await apiClient.delete(`/hr/announcements/${annId}`);
            message.success('Announcement deleted');
            fetchAnnouncements();
        } catch (error: any) { message.error(error.response?.data?.error || 'Failed to delete'); }
    };

    const resetForm = () => {
        setTitle(''); setContent(''); setType('general'); setPriority('medium');
        setTargetAudience('all'); setTargetDepartments([]); setTargetUsers([]);
        setIsPinned(false); setExpiresAt(null); setEditingAnn(null);
    };

    const openCreateDrawer = () => { resetForm(); setDrawerOpen(true); };
    const openEditDrawer = (ann: any) => {
        setEditingAnn(ann);
        setTitle(ann.title); setContent(ann.content); setType(ann.type); setPriority(ann.priority);
        setTargetAudience(ann.targetAudience); setTargetDepartments(ann.targetDepartments || []);
        setTargetUsers(ann.targetUsers?.map((u: any) => u.toString()) || []);
        setIsPinned(ann.isPinned); setExpiresAt(ann.expiresAt ? dayjs(ann.expiresAt) : null);
        setDrawerOpen(true);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) { message.warning('Title and content are required'); return; }
        setSubmitLoading(true);
        try {
            const payload = {
                title, content, type, priority, targetAudience,
                targetDepartments: targetAudience === 'department' ? targetDepartments : [],
                targetUsers: targetAudience === 'specific_users' ? targetUsers : [],
                isPinned,
                expiresAt: expiresAt?.toISOString() || null,
            };
            if (editingAnn) {
                const res = await apiClient.put(`/hr/announcements/${editingAnn._id}`, payload);
                if (res.data.success) { message.success('Announcement updated'); setDrawerOpen(false); resetForm(); fetchAnnouncements(); }
            } else {
                const res = await apiClient.post('/hr/announcements', payload);
                if (res.data.success) { message.success('Announcement posted'); setDrawerOpen(false); resetForm(); fetchAnnouncements(); }
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save');
        } finally { setSubmitLoading(false); }
    };

    const pinnedAnnouncements = announcements.filter(a => a.isPinned);
    const regularAnnouncements = announcements.filter(a => !a.isPinned);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <PageHeader title="Announcements" />
                <Space>
                    <Select placeholder="Type" style={{ width: 130 }} allowClear onChange={(v) => setFilters({ ...filters, type: v })}
                        options={[
                            { label: 'General', value: 'general' }, { label: 'Policy', value: 'policy' },
                            { label: 'Holiday', value: 'holiday' }, { label: 'Event', value: 'event' }, { label: 'Urgent', value: 'urgent' },
                        ]}
                    />
                    <Select placeholder="Priority" style={{ width: 120 }} allowClear onChange={(v) => setFilters({ ...filters, priority: v })}
                        options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]}
                    />
                    {isManager && (
                        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreateDrawer}>
                            New Announcement
                        </Button>
                    )}
                </Space>
            </Flex>

            {announcements.length === 0 ? (
                <Empty description="No announcements" />
            ) : (
                <div>
                    {/* Pinned */}
                    {pinnedAnnouncements.map(ann => (
                        <Card
                            key={ann._id}
                            style={{ marginBottom: 16, borderRadius: 12, backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}
                        >
                            <Flex justify="space-between" align="start" wrap="wrap" gap={8}>
                                <div style={{ flex: 1 }}>
                                    <Flex gap={6} align="center" style={{ marginBottom: 8 }}>
                                        <PushpinFilled style={{ color: '#faad14' }} />
                                        <Tag color={typeColors[ann.type]}>{ann.type}</Tag>
                                        <Tag color={priorityColors[ann.priority]}>{ann.priority}</Tag>
                                    </Flex>
                                    <Title level={5} style={{ margin: '0 0 4px 0' }}>{ann.title}</Title>
                                    <Paragraph style={{ margin: '0 0 8px 0', fontSize: 14 }}>{ann.content}</Paragraph>
                                    <Flex justify="space-between" align="center">
                                        <Space>
                                            <Avatar src={ann.createdBy?.avatar} size={20}>{ann.createdBy?.name?.charAt(0)}</Avatar>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{ann.createdBy?.name} • {dayjs(ann.createdAt).fromNow()}</Text>
                                        </Space>
                                        <Space>
                                            <Text type="secondary" style={{ fontSize: 11 }}><ReadOutlined /> {ann.readBy?.length || 0} read</Text>
                                            {!ann.readByMe && <Button size="small" type="link" onClick={() => handleMarkRead(ann._id)}>Mark as Read</Button>}
                                            {isManager && <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditDrawer(ann)} />}
                                            {isManager && (
                                                <Popconfirm title="Delete this announcement?" onConfirm={() => handleDelete(ann._id)}>
                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    </Flex>
                                </div>
                            </Flex>
                        </Card>
                    ))}

                    {/* Regular */}
                    {regularAnnouncements.map(ann => (
                        <Card
                            key={ann._id}
                            style={{ marginBottom: 12, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                        >
                            <Flex justify="space-between" align="start" wrap="wrap" gap={8}>
                                <div style={{ flex: 1 }}>
                                    <Flex gap={6} align="center" style={{ marginBottom: 8 }}>
                                        <Tag color={typeColors[ann.type]}>{ann.type}</Tag>
                                        {ann.priority === 'high' && <Tag color="red">HIGH</Tag>}
                                    </Flex>
                                    <Title level={5} style={{ margin: '0 0 4px 0' }}>{ann.title}</Title>
                                    <Paragraph style={{ margin: '0 0 8px 0', fontSize: 14, color: '#595959' }}>{ann.content}</Paragraph>
                                    <Flex justify="space-between" align="center">
                                        <Space>
                                            <Avatar src={ann.createdBy?.avatar} size={20}>{ann.createdBy?.name?.charAt(0)}</Avatar>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{ann.createdBy?.name} • {dayjs(ann.createdAt).fromNow()}</Text>
                                        </Space>
                                        <Space>
                                            <Text type="secondary" style={{ fontSize: 11 }}><ReadOutlined /> {ann.readBy?.length || 0} read</Text>
                                            {!ann.readByMe && <Button size="small" type="link" onClick={() => handleMarkRead(ann._id)}>Mark as Read</Button>}
                                            {isManager && <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditDrawer(ann)} />}
                                            {isManager && (
                                                <Popconfirm title="Delete this announcement?" onConfirm={() => handleDelete(ann._id)}>
                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    </Flex>
                                </div>
                            </Flex>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Drawer */}
            <Drawer
                title={editingAnn ? 'Edit Announcement' : 'New Announcement'}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); resetForm(); }}
                width={560}
                footer={
                    <Flex justify="end" gap={8}>
                        <Button onClick={() => { setDrawerOpen(false); resetForm(); }}>Cancel</Button>
                        <Button type="primary" loading={submitLoading} onClick={handleSubmit}>
                            {editingAnn ? 'Update' : 'Post'} Announcement
                        </Button>
                    </Flex>
                }
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Title *</Text>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
                </div>
                <Flex gap={12} style={{ marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Type</Text>
                        <Select value={type} onChange={setType} style={{ width: '100%' }} options={[
                            { label: 'General', value: 'general' }, { label: 'Policy', value: 'policy' },
                            { label: 'Holiday', value: 'holiday' }, { label: 'Event', value: 'event' }, { label: 'Urgent', value: 'urgent' },
                        ]} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Priority</Text>
                        <Select value={priority} onChange={setPriority} style={{ width: '100%' }} options={[
                            { label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' },
                        ]} />
                    </div>
                </Flex>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Content *</Text>
                    <Input.TextArea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Announcement content..." />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Target Audience</Text>
                    <Radio.Group value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                        <Radio value="all">All</Radio>
                        <Radio value="department">Department</Radio>
                        <Radio value="specific_users">Specific Users</Radio>
                    </Radio.Group>
                </div>
                {targetAudience === 'department' && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Target Departments</Text>
                        <Select mode="multiple" value={targetDepartments} onChange={setTargetDepartments} style={{ width: '100%' }}
                            options={['Management', 'Operations', 'Production', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'].map(d => ({ label: d, value: d }))} />
                    </div>
                )}
                {targetAudience === 'specific_users' && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Target Users</Text>
                        <Select mode="multiple" value={targetUsers} onChange={setTargetUsers} style={{ width: '100%' }}
                            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                            options={users.map(u => ({ label: u.name, value: u._id }))} />
                    </div>
                )}
                <Flex gap={16} align="center" style={{ marginBottom: 16 }}>
                    <Space>
                        <Text strong>Pin to top</Text>
                        <Switch checked={isPinned} onChange={setIsPinned} />
                    </Space>
                </Flex>
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Expiry Date (optional)</Text>
                    <DatePicker value={expiresAt} onChange={setExpiresAt} style={{ width: '100%' }} />
                </div>
            </Drawer>
        </div>
    );
}
