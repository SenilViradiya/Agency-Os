'use client';

import React from 'react';
import { Table, Typography, Space, Button, Avatar, Tooltip } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import PriorityChip from '@/components/shared/PriorityChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface LeadTableProps {
    leads: any[];
    onEdit: (lead: any) => void;
    onDelete: (id: string) => void;
    onConvert: (lead: any) => void;
}

export default function LeadTable({ leads, onEdit, onDelete, onConvert }: LeadTableProps) {
    const router = useRouter();

    const columns: ColumnsType<any> = [
        {
            title: 'Lead#',
            dataIndex: 'leadNumber',
            key: 'leadNumber',
            render: (text) => <Text type="secondary" strong>{text}</Text>,
        },
        {
            title: 'Business Name',
            dataIndex: 'businessName',
            key: 'businessName',
            render: (text, record) => (
                <div>
                    <Text strong style={{ display: 'block' }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.industry}</Text>
                </div>
            ),
        },
        {
            title: 'Contact',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <Text style={{ display: 'block' }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                </div>
            ),
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
            title: 'Budget',
            dataIndex: 'budget',
            key: 'budget',
            render: (budget) => <Text strong>₹{budget?.toLocaleString('en-IN')}</Text>,
        },
        {
            title: 'Follow-up',
            dataIndex: 'followUpDate',
            key: 'followUpDate',
            render: (date) => (
                <Text type={dayjs(date).isBefore(dayjs()) ? 'danger' : undefined}>
                    {date ? dayjs(date).format('DD MMM YYYY') : '-'}
                </Text>
            ),
        },
        {
            title: 'Assigned',
            dataIndex: 'assignedTo',
            key: 'assignedTo',
            render: (user) => (
                <Tooltip title={user?.name}>
                    <Avatar src={user?.avatar}>{user?.name?.charAt(0)}</Avatar>
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
                        onClick={() => router.push(`/leads/${record._id}`)}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => onEdit(record)}
                    />
                    {record.status === 'won' && !record.convertedToClient && (
                        <Button
                            type="text"
                            icon={<UserAddOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => onConvert(record)}
                        />
                    )}
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={record.convertedToClient}
                        onClick={() => onDelete(record._id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={leads}
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
