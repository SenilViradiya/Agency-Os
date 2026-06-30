'use client';

import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Switch, Typography } from 'antd';
import { EyeOutlined, EditOutlined, FileAddOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface VendorTableProps {
  data: any[];
  loading: boolean;
  pagination: any;
  onTableChange: (pagination: any) => void;
  onView: (id: string) => void;
  onEdit: (record: any) => void;
  onLogBill: (record: any) => void;
  onToggleStatus: (id: string, current: string) => void;
}

export default function VendorTable({
  data,
  loading,
  pagination,
  onTableChange,
  onView,
  onEdit,
  onLogBill,
  onToggleStatus,
}: VendorTableProps) {
  const getVendorTypeTag = (type: string) => {
    const types: Record<string, string> = {
      freelancer: 'Freelancer',
      agency: 'Agency partner',
      consultant: 'Consultant',
      service_provider: 'Service Provider',
      other: 'Other Partner',
    };
    return <Tag color="cyan" style={{ borderRadius: 6 }}>{types[type] || type}</Tag>;
  };

  const columns = [
    {
      title: 'Vendor Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Text strong style={{ color: '#6C63FF', cursor: 'pointer' }} onClick={() => onView(record._id)}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'vendorType',
      key: 'vendorType',
      render: (type: string) => getVendorTypeTag(type),
    },
    {
      title: 'Contact Details',
      key: 'contact',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{record.email}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
        </Space>
      ),
    },
    {
      title: 'Total Billed',
      dataIndex: 'totalBilled',
      key: 'totalBilled',
      align: 'right' as const,
      render: (val: number) => <Text strong>₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Total Paid',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      align: 'right' as const,
      render: (val: number) => <Text style={{ color: '#52c41a' }} strong>₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Outstanding',
      dataIndex: 'totalPending',
      key: 'totalPending',
      align: 'right' as const,
      render: (val: number) => <Text style={{ color: '#ff4d4f' }} strong>₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Switch
          checked={status === 'active'}
          onChange={() => onToggleStatus(record._id, status)}
          checkedChildren="ACTIVE"
          unCheckedChildren="INACTIVE"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="View Vendor Ledger">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record._id)}
              style={{ color: '#0958d9' }}
            />
          </Tooltip>

          <Tooltip title="Edit Profile">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              style={{ color: '#faad14' }}
            />
          </Tooltip>

          <Tooltip title="Log Bill / Invoice">
            <Button
              type="text"
              icon={<FileAddOutlined />}
              disabled={record.status !== 'active'}
              onClick={() => onLogBill(record)}
              style={{ color: record.status !== 'active' ? undefined : '#52c41a' }}
            />
          </Tooltip>
        </Space>
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
        showTotal: (total) => `Total ${total} vendors`,
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
