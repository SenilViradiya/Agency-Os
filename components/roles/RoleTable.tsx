'use client';

import React from 'react';
import { Table, Tag, Typography, Space, Button, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface RoleTableProps {
    roles: any[];
    onEdit: (role: any) => void;
    onDelete: (role: any) => void;
}

export default function RoleTable({ roles, onEdit, onDelete }: RoleTableProps) {
    const columns: ColumnsType<any> = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{text}</code>,
        },
        {
            title: 'Permissions Count',
            key: 'permissions',
            render: (_, record) => (
                <Text>
                    {record.permissions.reduce((acc: number, p: any) => acc + p.actions.length, 0)} actions
                </Text>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'isSystem',
            key: 'isSystem',
            render: (isSystem) => (
                isSystem ? (
                    <Tag icon={<LockOutlined />} color="blue">System</Tag>
                ) : (
                    <Tag>Custom</Tag>
                )
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Permissions">
                        <Button 
                            type="text" 
                            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                            onClick={() => onEdit(record)} 
                        />
                    </Tooltip>
                    {!record.isSystem && (
                        <Tooltip title="Delete">
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />} 
                                onClick={() => onDelete(record)} 
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Table 
            columns={columns} 
            dataSource={roles} 
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            style={{ 
                borderRadius: 12, 
                overflow: 'hidden', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
            }}
        />
    );
}
