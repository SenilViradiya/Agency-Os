'use client';

import React from 'react';
import { Table, Typography, Space, Button, Avatar, Tag, Flex } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface ClientTableProps {
    clients: any[];
    onEdit: (client: any) => void;
    onDelete: (id: string) => void;
}

export default function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
    const router = useRouter();

    const columns: ColumnsType<any> = [
        {
            title: 'Client',
            key: 'client',
            render: (_, record) => (
                <Flex align="center" gap={12}>
                    <Avatar src={record.logo} shape="square" size={36}>
                        {record.businessName.charAt(0)}
                    </Avatar>
                    <div>
                        <Text strong style={{ display: 'block' }}>{record.businessName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.clientNumber}</Text>
                    </div>
                </Flex>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_, record) => (
                <div>
                    <Text style={{ display: 'block' }}>{record.contactPerson}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                </div>
            ),
        },
        {
            title: 'Tier',
            dataIndex: 'tier',
            key: 'tier',
            render: (tier) => {
                const color = tier === 'enterprise' ? 'gold' : tier === 'premium' ? 'purple' : 'default';
                return <Tag color={color} style={{ fontWeight: 700, textTransform: 'capitalize' }}>{tier}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <StatusChip status={status} />,
        },
        {
            title: 'Services',
            dataIndex: 'services',
            key: 'services',
            render: (services) => <Text type="secondary">{services?.length || 0} services</Text>,
        },
        {
            title: 'Retainer',
            dataIndex: 'monthlyRetainerValue',
            key: 'monthlyRetainerValue',
            render: (value) => <Text strong>₹{value?.toLocaleString('en-IN')}</Text>,
        },
        {
            title: 'Manager',
            dataIndex: 'assignedManager',
            key: 'assignedManager',
            render: (user) => (
                <Flex align="center" gap={8}>
                    <Avatar size="small" src={user?.avatar}>{user?.name?.charAt(0)}</Avatar>
                    <Text style={{ fontSize: 13 }}>{user?.name}</Text>
                </Flex>
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
                        onClick={() => router.push(`/clients/${record._id}`)} 
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
            dataSource={clients} 
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            style={{ 
                borderRadius: 12, 
                overflow: 'hidden', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
            }}
        />
    );
}
