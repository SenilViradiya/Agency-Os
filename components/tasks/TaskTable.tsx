'use client';

import { Table, Tag, Space, Button, Avatar, Tooltip, Progress, Popconfirm, Typography, Card } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TaskTableProps {
    tasks: any[];
    loading: boolean;
    onEdit: (task: any) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    todo: 'default',
    in_progress: 'blue',
    in_review: 'orange',
    done: 'green',
    blocked: 'red'
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
};

export default function TaskTable({ tasks, loading, onEdit, onDelete, onView }: TaskTableProps) {
    const columns = [
        {
            title: 'TSK#',
            dataIndex: 'taskNumber',
            key: 'taskNumber',
            width: 100,
            render: (text: string) => <Text style={{ fontSize: 13, color: '#6C63FF', fontWeight: 600 }}>{text}</Text>
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <div style={{ maxWidth: 300 }}>
                    <Text strong style={{ display: 'block' }}>{text}</Text>
                    {record.isPipelineTask && (
                        <Tag color="purple" style={{ fontSize: 10, marginTop: 4 }}>
                            PIPELINE · {record.pipelineStage?.toUpperCase()}
                        </Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</Tag>
        },
        {
            title: 'Entity',
            key: 'entity',
            render: (_: any, record: any) => (
                <Tag color={
                    record.entityType === 'project' ? 'blue' : 
                    record.entityType === 'content_item' ? 'purple' : 'default'
                }>
                    {record.entityType.toUpperCase()}
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
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => (
                <Tag color={PRIORITY_COLORS[priority]} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                    {priority}
                </Tag>
            )
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (date: string) => {
                if (!date) return '-';
                const isOverdue = dayjs(date).isBefore(dayjs()) && dayjs(date).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD');
                return (
                    <Space size={4}>
                        <CalendarOutlined style={{ fontSize: 12, color: isOverdue ? '#ff4d4f' : '#8c8c8c' }} />
                        <Text style={{ fontSize: 13, color: isOverdue ? '#ff4d4f' : 'inherit' }}>
                            {dayjs(date).format('DD MMM YYYY')}
                        </Text>
                    </Space>
                );
            }
        },
        {
            title: 'Assignees',
            dataIndex: 'assignedTo',
            key: 'assignedTo',
            render: (assignedTo: any[]) => (
                <Avatar.Group max={{ count: 3 }} size="small">
                    {assignedTo?.map((user: any) => (
                        <Tooltip title={user.name} key={user._id}>
                            <Avatar src={user.avatar}>{user.name?.charAt(0)}</Avatar>
                        </Tooltip>
                    ))}
                </Avatar.Group>
            )
        },
        {
            title: 'Checklist',
            key: 'checklist',
            render: (_: any, record: any) => {
                const total = record.checklist?.length || 0;
                if (total === 0) return '-';
                const done = record.checklist.filter((i: any) => i.isDone).length;
                return (
                    <div style={{ width: 100 }}>
                        <Text style={{ fontSize: 11 }}>{done}/{total}</Text>
                        <Progress percent={Math.round((done / total) * 100)} size="small" showInfo={false} strokeColor="#6C63FF" />
                    </div>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record._id)} />
                    </Tooltip>
                    <Tooltip title="Edit Task">
                        <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete Task"
                        description="Are you sure you want to delete this task?"
                        onConfirm={() => onDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <Table
                dataSource={tasks}
                columns={columns}
                loading={loading}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
            />
        </Card>
    );
}
