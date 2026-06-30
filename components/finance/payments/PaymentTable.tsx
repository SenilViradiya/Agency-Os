'use client';

import React from 'react';
import { Table, Tag, Space, Button, Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface PaymentTableProps {
  data: any[];
  loading: boolean;
  pagination: any;
  onTableChange: (pagination: any) => void;
  onDelete: (id: string) => void;
  hasDeletePermission: boolean;
}

export default function PaymentTable({
  data,
  loading,
  pagination,
  onTableChange,
  onDelete,
  hasDeletePermission,
}: PaymentTableProps) {
  const columns = [
    {
      title: 'Payment #',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (inv: any) => (
        <Text strong style={{ color: '#6C63FF' }}>
          {inv?.invoiceNumber || '-'}
        </Text>
      ),
    },
    {
      title: 'Client Business',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (client: any) => <Text>{client?.businessName || '-'}</Text>,
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Method',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (m: string) => <Tag color="blue">{m.replace('_', ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Reference / Bank',
      key: 'reference',
      render: (_: any, record: any) => (
        <span>
          {record.referenceNumber || '-'}{' '}
          {record.bankName ? `(${record.bankName})` : ''}
        </span>
      ),
    },
    {
      title: 'Amount Received',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Popconfirm
          title="Delete payment log?"
          description="This will increase the invoice outstanding balance and subtract from client total revenue metrics."
          onConfirm={() => onDelete(record._id)}
          okText="Yes, delete"
          cancelText="Cancel"
          disabled={!hasDeletePermission}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={!hasDeletePermission}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={{
        total: pagination.total,
        current: pagination.page,
        pageSize: pagination.limit,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} payments`,
      }}
      onChange={onTableChange}
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      }}
    />
  );
}
