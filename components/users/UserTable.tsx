'use client';

import React from 'react';
import { Table, Avatar, Typography, Space, Button, Tooltip, Flex } from 'antd';
import { EditOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface UserTableProps {
    users: any[];
    loading: boolean;
    onEdit: (user: any) => void;
    onDelete: (user: any) => void;
    onDeactivate: (user: any) => void;
}

export default function UserTable({ users, loading, onEdit, onDelete, onDeactivate }: UserTableProps) {
    const columns: ColumnsType<any> = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Flex align="center" gap={12}>
                    <Avatar 
                        src={record.avatar} 
                        style={{ backgroundColor: '#6C63FF' }}
                    >
                        {record.name.charAt(0)}
                    </Avatar>
                    <div>
                        <Text strong style={{ display: 'block' }}>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.designation}</Text>
                    </div>
                </Flex>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: ['role', 'name'],
            key: 'role',
            render: (text) => text || 'N/A',
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <StatusChip status={status} />,
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                            onClick={() => onEdit(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="Deactivate">
                        <Button 
                            type="text" 
                            icon={<StopOutlined style={{ color: '#faad14' }} />} 
                            onClick={() => onDeactivate(record)} 
                            disabled={record.status === 'inactive'}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => onDelete(record)} 
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table 
            columns={columns} 
            dataSource={users} 
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            style={{ 
                borderRadius: 12, 
                overflow: 'hidden', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
            }}
            locale={{ emptyText: 'No users found.' }}
        />
    );
}
