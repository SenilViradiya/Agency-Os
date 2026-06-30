'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Card, 
    Flex, 
    Typography, 
    Avatar, 
    Button, 
    Tabs, 
    Pagination, 
    Empty, 
    Spin, 
    App as AntdApp,
    Tooltip
} from 'antd';
import { 
    FileSearchOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined, 
    SendOutlined, 
    UserOutlined,
    ClockCircleOutlined,
    CheckOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';

dayjs.extend(relativeTime);
const { Text, Title } = Typography;

export default function NotificationsPage() {
    const router = useRouter();
    const { message } = AntdApp.useApp();

    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, unread: 0 });
    
    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', pageSize.toString());

            if (activeTab === 'unread') {
                params.append('isRead', 'false');
            } else if (activeTab === 'read') {
                params.append('isRead', 'true');
            }

            const res = await apiClient.get(`/notifications?${params.toString()}`);
            if (res.data.success) {
                setNotifications(res.data.data);
                setStats({
                    total: res.data.meta.total,
                    unread: res.data.meta.unreadCount
                });
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            message.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, activeTab, message]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiClient.put(`/notifications/${id}/read`);
            message.success('Notification marked as read');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            message.error('Failed to update notification');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.put('/notifications/read-all');
            message.success('All notifications marked as read ✓');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            message.error('Failed to update notifications');
        }
    };

    const handleRowClick = async (item: any) => {
        if (!item.isRead) {
            try {
                await apiClient.put(`/notifications/${item._id}/read`);
            } catch (error) {
                console.error(error);
            }
        }
        router.push(item.link);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'approval_requested': 
                return <FileSearchOutlined style={{ color: '#6C63FF' }} />;
            case 'content_approved': 
                return <CheckCircleOutlined style={{ color: '#4CAF50' }} />;
            case 'revision_requested': 
                return <ExclamationCircleOutlined style={{ color: '#FF9800' }} />;
            case 'content_published': 
                return <SendOutlined style={{ color: '#FF6584' }} />;
            case 'task_assigned': 
                return <UserOutlined style={{ color: '#6C63FF' }} />;
            default: 
                return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
        }
    };

    const tabs = [
        { key: 'all', label: `All (${activeTab === 'all' ? stats.total : '...'})` },
        { key: 'unread', label: `Unread (${stats.unread})` },
        { key: 'read', label: 'Read' }
    ];

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 8px' }}>
            <PageHeader 
                title="Notifications" 
                subtitle="Keep track of your approvals, publishing schedules, and assigned tasks."
                action={
                    stats.unread > 0 && (
                        <Button 
                            type="primary" 
                            icon={<CheckOutlined />} 
                            onClick={handleMarkAllRead}
                            style={{ borderRadius: 8, fontWeight: 500 }}
                        >
                            Mark all as read
                        </Button>
                    )
                }
            />

            <Card style={{ borderRadius: 12, marginBottom: 24 }}>
                <Tabs 
                    activeKey={activeTab} 
                    onChange={(key) => { setActiveTab(key); setPage(1); }} 
                    items={tabs}
                    style={{ marginBottom: 0 }}
                />
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Spin size="large" />
                </div>
            ) : notifications.length === 0 ? (
                <Card style={{ borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Flex vertical gap={4}>
                                <Text strong style={{ fontSize: 16 }}>No notifications</Text>
                                <Text type="secondary">You are all caught up!</Text>
                            </Flex>
                        }
                    />
                </Card>
            ) : (
                <Flex vertical gap={12} style={{ marginBottom: 24 }}>
                    {notifications.map((item) => (
                        <div
                            key={item._id}
                            onClick={() => handleRowClick(item)}
                            style={{
                                cursor: 'pointer',
                                padding: '16px 20px',
                                backgroundColor: item.isRead ? '#ffffff' : '#f0f4ff',
                                border: '1px solid #f0f0f0',
                                borderRadius: 12,
                                transition: 'all 0.3s ease',
                                boxShadow: item.isRead ? 'none' : '0 2px 8px rgba(108, 99, 255, 0.05)',
                                position: 'relative'
                            }}
                            className="notification-item"
                        >
                            <Flex justify="space-between" align="center" gap={16}>
                                <Flex gap={16} align="start" style={{ flex: 1, minWidth: 0 }}>
                                    <Avatar 
                                        icon={getIcon(item.type)} 
                                        size={40}
                                        style={{ 
                                            backgroundColor: '#fff', 
                                            border: '1px solid #f0f0f0', 
                                            flexShrink: 0,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }} 
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                                            <Text strong={!item.isRead} style={{ fontSize: 15, color: '#333' }}>
                                                {item.title}
                                            </Text>
                                            {!item.isRead && (
                                                <div style={{ 
                                                    width: 6, 
                                                    height: 6, 
                                                    borderRadius: '50%', 
                                                    backgroundColor: '#6C63FF' 
                                                }} />
                                            )}
                                        </Flex>
                                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                                            {item.message}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                                            {dayjs(item.createdAt).fromNow()}
                                        </Text>
                                    </div>
                                </Flex>
                                <Flex gap={8} style={{ flexShrink: 0 }}>
                                    {!item.isRead && (
                                        <Tooltip title="Mark as read">
                                            <Button 
                                                shape="circle" 
                                                icon={<CheckOutlined />} 
                                                onClick={(e) => handleMarkAsRead(item._id, e)}
                                                style={{ border: 'none', background: 'transparent' }}
                                            />
                                        </Tooltip>
                                    )}
                                    <Tooltip title="View target page">
                                        <Button 
                                            shape="circle" 
                                            icon={<EyeOutlined />} 
                                            style={{ border: 'none', background: 'transparent' }}
                                        />
                                    </Tooltip>
                                </Flex>
                            </Flex>
                        </div>
                    ))}

                    <Flex justify="center" style={{ marginTop: 16 }}>
                        <Pagination 
                            current={page}
                            pageSize={pageSize}
                            total={stats.total}
                            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
                            showSizeChanger
                            showTotal={(total) => `Total ${total} notification${total !== 1 ? 's' : ''}`}
                        />
                    </Flex>
                </Flex>
            )}
        </div>
    );
}
