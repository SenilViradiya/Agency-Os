'use client';

import React from 'react';
import { Avatar, Typography, Button, Space, Divider, Empty, Flex, App as AntdApp } from 'antd';
import { 
    FileSearchOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined, 
    SendOutlined, 
    UserOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { useNotifications } from '@/hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'next/navigation';

dayjs.extend(relativeTime);
const { Text } = Typography;

export default function NotificationPopover({ onClose }: { onClose: () => void }) {
    const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
    const router = useRouter();
    const { message } = AntdApp.useApp();

    const getIcon = (type: string) => {
        switch (type) {
            case 'approval_requested': return <FileSearchOutlined style={{ color: '#1890ff' }} />;
            case 'content_approved': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'revision_requested': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
            case 'content_published': return <SendOutlined style={{ color: '#722ed1' }} />;
            case 'task_assigned': return <UserOutlined style={{ color: '#1890ff' }} />;
            default: return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
        }
    };

    const handleItemClick = async (item: any) => {
        if (!item.isRead) {
            await markAsRead(item._id);
        }
        router.push(item.link);
        onClose();
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        message.success('All notifications marked as read');
    };

    return (
        <div style={{ width: 380, maxHeight: 500, overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 16 }}>Notifications</Text>
                <Button type="link" size="small" onClick={handleMarkAllRead}>Mark all as read</Button>
            </div>
            <Divider style={{ margin: 0 }} />
            
            {notifications.length === 0 ? (
                <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="No notifications yet" 
                    style={{ padding: '40px 0' }}
                />
            ) : (
                <Flex vertical>
                    {notifications.map((item: any) => (
                        <div
                            key={item._id}
                            onClick={() => handleItemClick(item)}
                            style={{ 
                                cursor: 'pointer', 
                                padding: '12px 16px',
                                backgroundColor: item.isRead ? 'transparent' : '#f0f7ff',
                                transition: 'background-color 0.3s',
                                borderBottom: '1px solid #f0f0f0'
                            }}
                        >
                            <Flex gap={12} align="start">
                                <Avatar 
                                    icon={getIcon(item.type)} 
                                    style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', flexShrink: 0 }} 
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Flex justify="space-between" align="center">
                                        <Text strong={!item.isRead} ellipsis>{item.title}</Text>
                                        <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{dayjs(item.createdAt).fromNow()}</Text>
                                    </Flex>
                                    <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                                        {item.message}
                                    </Text>
                                </div>
                            </Flex>
                        </div>
                    ))}
                </Flex>
            )}
            
            <Divider style={{ margin: 0 }} />
            <div style={{ padding: '8px', textAlign: 'center' }}>
                <Button type="link" block onClick={() => { router.push('/notifications'); onClose(); }}>
                    View all notifications
                </Button>
            </div>
        </div>
    );
}
