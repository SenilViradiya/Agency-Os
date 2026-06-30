'use client';

import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Typography } from 'antd';
import { EditOutlined, CheckOutlined, DollarOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ExpenseTableProps {
  data: any[];
  loading: boolean;
  pagination: any;
  onTableChange: (pagination: any) => void;
  onEdit: (record: any) => void;
  onApprove: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
  isManager: boolean;
}

export default function ExpenseTable({
  data,
  loading,
  pagination,
  onTableChange,
  onEdit,
  onApprove,
  onMarkPaid,
  onDelete,
  isManager,
}: ExpenseTableProps) {
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      equipment: 'Equipment',
      software_subscription: 'Software Subscription',
      travel: 'Travel',
      shoot_location: 'Shoot Location',
      office_rent: 'Office Rent',
      utilities: 'Utilities',
      marketing: 'Marketing',
      salary: 'Salary / Wages',
      vendor_payment: 'Vendor Payment',
      misc: 'Miscellaneous',
      other: 'Other Expense',
    };
    return categories[category] || category;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'orange', label: 'Pending Approval' },
      approved: { color: 'blue', label: 'Approved' },
      paid: { color: 'green', label: 'Paid' },
    };

    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color} style={{ borderRadius: 6, fontWeight: 500 }}>{config.label.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: 'Expense #',
      dataIndex: 'expenseNumber',
      key: 'expenseNumber',
      render: (t: string, record: any) => (
        <Text strong style={{ color: '#6C63FF', cursor: 'pointer' }} onClick={() => onEdit(record)}>
          {t}
        </Text>
      ),
    },
    {
      title: 'Title / Category',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{getCategoryLabel(record.category)}</Text>
        </Space>
      ),
    },
    {
      title: 'Linked Project/Client',
      key: 'linked',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          {record.projectId?.name ? <Text style={{ fontSize: 13 }}>Proj: {record.projectId.name}</Text> : null}
          {record.clientId?.businessName ? <Text type="secondary" style={{ fontSize: 12 }}>Client: {record.clientId.businessName}</Text> : null}
          {!record.projectId?.name && !record.clientId?.businessName ? <Text type="secondary" style={{ fontSize: 12 }}>-</Text> : null}
        </Space>
      ),
    },
    {
      title: 'Expense Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => (
        <Text strong>₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => {
        const isPaid = record.status === 'paid';
        const isApproved = record.status === 'approved';
        const isPending = record.status === 'pending';

        return (
          <Space size="middle">
            <Tooltip title="View or Edit Details">
              <Button
                type="text"
                icon={<EditOutlined />}
                disabled={isPaid}
                onClick={() => onEdit(record)}
                style={{ color: isPaid ? undefined : '#faad14' }}
              />
            </Tooltip>

            {isPending && isManager && (
              <Tooltip title="Approve Expense">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={() => onApprove(record._id)}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
            )}

            {isApproved && (
              <Tooltip title="Mark as Paid">
                <Button
                  type="text"
                  icon={<DollarOutlined />}
                  onClick={() => onMarkPaid(record._id)}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
            )}

            <Tooltip title={isPaid ? "Paid expenses cannot be deleted" : "Delete Expense"}>
              <span>
                <Popconfirm
                  title="Are you sure you want to delete this expense record?"
                  description="It will be soft-deleted."
                  disabled={isPaid}
                  onConfirm={() => onDelete(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={isPaid}
                  />
                </Popconfirm>
              </span>
            </Tooltip>
          </Space>
        );
      },
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
        showTotal: (total) => `Total ${total} expenses`,
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
