'use client';

import { Table, Tag, Space, Button, Avatar, Tooltip, Typography, Card, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, FileTextOutlined, VideoCameraOutlined, EditOutlined as EditIcon, PictureOutlined, MessageOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ContentTableProps {
    items: any[];
    loading: boolean;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
}

const STAGE_CONFIG: Record<string, { icon: any, color: string }> = {
    script: { icon: <FileTextOutlined />, color: 'blue' },
    shoot: { icon: <VideoCameraOutlined />, color: 'orange' },
    edit: { icon: <EditIcon />, color: 'purple' },
    thumbnail: { icon: <PictureOutlined />, color: 'magenta' },
    caption: { icon: <MessageOutlined />, color: 'cyan' },
    approval: { icon: <CheckCircleOutlined />, color: 'gold' },
    publish: { icon: <SendOutlined />, color: 'green' },
    completed: { icon: <CheckCircleOutlined />, color: 'default' },
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'default',
    in_production: 'processing',
    in_approval: 'warning',
    approved: 'success',
    published: 'success',
    on_hold: 'default',
    cancelled: 'error'
};

export default function ContentTable({ items, loading, onEdit, onDelete, onView }: ContentTableProps) {
    const columns = [
        {
            title: 'CNT#',
            dataIndex: 'contentNumber',
            key: 'contentNumber',
            width: 100,
            render: (text: string) => <Text style={{ fontSize: 13, color: '#6C63FF', fontWeight: 600 }}>{text}</Text>
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <div style={{ maxWidth: 250 }}>
                    <Text strong style={{ display: 'block' }}>{text}</Text>
                    <Space size={4} style={{ marginTop: 4 }}>
                        <Tag style={{ fontSize: 10 }}>{record.contentType.replace('_', ' ').toUpperCase()}</Tag>
                    </Space>
                </div>
            )
        },
        {
            title: 'Project / Client',
            key: 'project',
            render: (_: any, record: any) => (
                <div>
                    <Text style={{ fontSize: 13, display: 'block' }}>{record.projectId?.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{record.clientId?.businessName}</Text>
                </div>
            )
        },
        {
            title: 'Current Stage',
            dataIndex: 'currentStage',
            key: 'currentStage',
            render: (stage: string) => (
                <Tag 
                    icon={STAGE_CONFIG[stage]?.icon} 
                    color={STAGE_CONFIG[stage]?.color}
                    style={{ textTransform: 'uppercase', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}
                >
                    {stage}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={STATUS_COLORS[status]} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                    {status.replace('_', ' ')}
                </Tag>
            )
        },
        {
            title: 'Publish Date',
            dataIndex: 'plannedPublishDate',
            key: 'plannedPublishDate',
            render: (date: string) => (
                <Space size={4}>
                    <CalendarOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                    <Text style={{ fontSize: 13 }}>{date ? dayjs(date).format('DD MMM YYYY') : '-'}</Text>
                </Space>
            )
        },
        {
            title: 'Platforms',
            dataIndex: 'platforms',
            key: 'platforms',
            render: (platforms: string[]) => (
                <Space size={2} wrap>
                    {platforms?.map(p => <Tag key={p} style={{ fontSize: 10, margin: 0 }}>{p}</Tag>)}
                </Space>
            )
        },
        {
            title: 'Owner',
            dataIndex: 'assignedTo',
            key: 'assignedTo',
            render: (user: any) => (
                <Space>
                    <Avatar size="small" src={user?.avatar}>{user?.name?.charAt(0)}</Avatar>
                    <Text style={{ fontSize: 13 }}>{user?.name}</Text>
                </Space>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record._id)} />
                    </Tooltip>
                    <Tooltip title="Edit Content">
                        <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete Content"
                        description="Only draft/cancelled content can be deleted. Continue?"
                        onConfirm={() => onDelete(record._id)}
                        disabled={!['draft', 'cancelled'].includes(record.status)}
                    >
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            disabled={!['draft', 'cancelled'].includes(record.status)}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <Table
                dataSource={items}
                columns={columns}
                loading={loading}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
            />
        </Card>
    );
}
