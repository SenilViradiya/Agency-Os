'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Tag, Input, Select, Button, Spin, Empty, Flex } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PortalInvoicesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState<string>('');

    useEffect(() => {
        setLoading(true);
        // We will load status parameter from endpoint in frontend filtering
        apiClient.get('/portal/invoices')
            .then(res => {
                if (res.data?.success) {
                    setInvoices(res.data.data);
                }
            })
            .catch(err => {
                console.error('Failed to load invoices list', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading invoices..." />
            </div>
        );
    }

    const filteredInvoices = invoices.filter(inv => {
        // Search filter
        const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
        
        // Status filter
        if (statusFilter === 'all') return matchSearch;
        if (statusFilter === 'pending') return matchSearch && ['sent', 'partially_paid'].includes(inv.status);
        return matchSearch && inv.status === statusFilter;
    });

    const formatCurrency = (val: number) => {
        return `₹${val.toLocaleString('en-IN')}`;
    };

    const columns = [
        {
            title: 'Invoice Number',
            dataIndex: 'invoiceNumber',
            key: 'invoiceNumber',
            render: (text: string, record: any) => (
                <span 
                    style={{ fontWeight: 600, color: '#FF6584', cursor: 'pointer' }}
                    onClick={() => router.push(`/portal/invoices/${record._id}`)}
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Date Issued',
            dataIndex: 'invoiceDate',
            key: 'invoiceDate',
            render: (val: any) => dayjs(val).format('DD MMM YYYY'),
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (val: any) => dayjs(val).format('DD MMM YYYY'),
        },
        {
            title: 'Total amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (val: number) => formatCurrency(val),
        },
        {
            title: 'Balance Due',
            dataIndex: 'amountDue',
            key: 'amountDue',
            render: (val: number) => (
                <Text type={val > 0 ? "warning" : "secondary"}>
                    {formatCurrency(val)}
                </Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={
                    status === 'paid' ? 'success' :
                    status === 'overdue' ? 'error' : 'warning'
                }>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Button 
                    type="link" 
                    icon={<EyeOutlined />} 
                    onClick={() => router.push(`/portal/invoices/${record._id}`)}
                    style={{ color: '#FF6584' }}
                >
                    View Details
                </Button>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Invoices & Billing</Title>
                <Text type="secondary">View status, breakdowns, bank details, and print PDFs.</Text>
            </div>

            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Space size={16}>
                        <Input
                            placeholder="Search by invoice number"
                            prefix={<SearchOutlined />}
                            onChange={(e) => setSearch(e.target.value)}
                            value={search}
                            style={{ width: 250 }}
                        />
                        <Select 
                            value={statusFilter} 
                            onChange={setStatusFilter} 
                            style={{ width: 180 }}
                        >
                            <Option value="all">All Invoices</Option>
                            <Option value="pending">Pending Payment</Option>
                            <Option value="paid">Paid</Option>
                            <Option value="overdue">Overdue</Option>
                        </Select>
                    </Space>
                </Flex>
            </Card>

            {filteredInvoices.length === 0 ? (
                <Empty description="No invoices found matching criteria." />
            ) : (
                <Table 
                    dataSource={filteredInvoices} 
                    columns={columns} 
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                    style={{ borderRadius: 12, overflow: 'hidden' }}
                />
            )}
        </div>
    );
}
export const dynamic = 'force-dynamic';
