'use client';

import React from 'react';
import { Table, Typography, Space, Button, Avatar, Progress, Tooltip, Flex } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import PriorityChip from '@/components/shared/PriorityChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface ProjectTableProps {
    projects: any[];
    onEdit: (project: any) => void;
    onDelete: (id: string) => void;
}

export default function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
    const router = useRouter();

    const columns: ColumnsType<any> = [
        {
            title: 'Project',
            key: 'project',
            render: (_, record) => (
                <div>
                    <Text strong style={{ display: 'block' }}>{record.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.projectNumber} • <span style={{ textTransform: 'capitalize' }}>{record.type}</span>
                    </Text>
                </div>
            ),
        },
        {
            title: 'Client',
            dataIndex: ['clientId', 'businessName'],
            key: 'client',
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <StatusChip status={status} />,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority) => <PriorityChip priority={priority} />,
        },
        {
            title: 'Progress',
            key: 'progress',
            width: 200,
            render: (_, record) => (
                <div>
                    <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                        <Progress 
                            percent={record.completionPercentage} 
                            size="small" 
                            showInfo={false} 
                            strokeColor="#6C63FF"
                        />
                        <Text strong style={{ fontSize: 12, minWidth: 35 }}>{record.completionPercentage}%</Text>
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.completedTasks}/{record.totalTasks} Tasks
                    </Text>
                </div>
            ),
        },
        {
            title: 'Deadline',
            dataIndex: 'deadline',
            key: 'deadline',
            render: (date) => (
                <Text type={dayjs(date).isBefore(dayjs()) ? 'danger' : undefined}>
                    {date ? dayjs(date).format('DD MMM YYYY') : '-'}
                </Text>
            ),
        },
        {
            title: 'Manager',
            dataIndex: 'projectManager',
            key: 'manager',
            render: (user) => (
                <Tooltip title={user?.name}>
                    <Avatar size="small" src={user?.avatar}>{user?.name?.charAt(0)}</Avatar>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="text" 
                        icon={<EyeOutlined />} 
                        onClick={() => router.push(`/projects/${record._id}`)} 
                    />
                    <Button 
                        type="text" 
                        icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                        onClick={() => onEdit(record)} 
                    />
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => onDelete(record._id)} 
                    />
                </Space>
            ),
        },
    ];

    return (
        <Table 
            columns={columns} 
            dataSource={projects} 
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            style={{ 
                borderRadius: 12, 
                overflow: 'hidden', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
            }}
            locale={{ emptyText: <Text type="secondary">No projects discovered.</Text> }}
        />
    );
}
