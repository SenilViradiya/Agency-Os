'use client';

import React from 'react';
import { Table, Tag, Typography, Button, Space, Avatar, Tooltip } from 'antd';
import { 
    ExportOutlined, 
    EyeOutlined, 
    GlobalOutlined,
    UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

export default function PublishedLog({ data, loading }: { data: any[], loading: boolean }) {
    const router = useRouter();

    const columns = [
        {
            title: 'CNT#',
            dataIndex: 'contentNumber',
            key: 'contentNumber',
            width: 100,
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <div style={{ maxWidth: 300 }}>
                    <Text strong style={{ display: 'block' }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.projectId?.name}</Text>
                </div>
            )
        },
        {
            title: 'Client',
            dataIndex: ['clientId', 'businessName'],
            key: 'client',
        },
        {
            title: 'Platform',
            dataIndex: ['publishData', 'platform'],
            key: 'platform',
            render: (text: string) => <Tag>{text?.toUpperCase() || 'N/A'}</Tag>
        },
        {
            title: 'Published Date',
            dataIndex: ['publishData', 'publishedAt'],
            key: 'publishedAt',
            render: (date: string) => dayjs(date).format('DD MMM YYYY, HH:mm')
        },
        {
            title: 'URL',
            dataIndex: ['publishData', 'publishedUrl'],
            key: 'publishedUrl',
            render: (url: string) => (
                <Tooltip title={url}>
                    <Button 
                        type="link" 
                        icon={<ExportOutlined />} 
                        href={url} 
                        target="_blank"
                        style={{ padding: 0 }}
                    >
                        View Live
                    </Button>
                </Tooltip>
            )
        },
        {
            title: 'Published By',
            dataIndex: ['publishData', 'publishedBy'],
            key: 'publishedBy',
            render: (user: any) => (
                <Space>
                    <Avatar size="small" src={user?.avatar} icon={<UserOutlined />} />
                    <Text style={{ fontSize: 12 }}>{user?.name}</Text>
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Button 
                    icon={<EyeOutlined />} 
                    size="small" 
                    onClick={() => router.push(`/content/${record._id}`)}
                >
                    Details
                </Button>
            )
        }
    ];

    return (
        <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 15 }}
            size="middle"
            style={{ backgroundColor: '#fff', borderRadius: 12 }}
        />
    );
}
