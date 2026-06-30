'use client';

import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Typography } from 'antd';
import { EyeOutlined, EditOutlined, SendOutlined, DollarOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface InvoiceTableProps {
  data: any[];
  loading: boolean;
  pagination: any;
  onTableChange: (pagination: any) => void;
  onView: (id: string) => void;
  onEdit: (record: any) => void;
  onSend: (id: string) => void;
  onLogPayment: (record: any) => void;
  onCancel: (id: string) => void;
}

export default function InvoiceTable({
  data,
  loading,
  pagination,
  onTableChange,
  onView,
  onEdit,
  onSend,
  onLogPayment,
  onCancel,
}: InvoiceTableProps) {
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      draft: { color: 'default', label: 'Draft' },
      sent: { color: 'blue', label: 'Sent' },
      partially_paid: { color: 'orange', label: 'Partially Paid' },
      paid: { color: 'green', label: 'Paid' },
      overdue: { color: 'red', label: 'Overdue' },
      cancelled: { color: 'default', label: 'Cancelled' },
    };

    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color} style={{ borderRadius: 6, fontWeight: 500 }}>{config.label.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text: string, record: any) => (
        <Text strong style={{ color: '#6C63FF', cursor: 'pointer' }} onClick={() => onView(record._id)}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Client / Business',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.invoiceType.toUpperCase()} {record.billingPeriod ? `(${record.billingPeriod})` : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string, record: any) => {
        const isOverdue = record.status === 'overdue';
        return <Text type={isOverdue ? 'danger' : undefined}>{dayjs(date).format('DD MMM YYYY')}</Text>;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
      ),
      align: 'right' as const,
    },
    {
      title: 'Balance / Due',
      dataIndex: 'amountDue',
      key: 'amountDue',
      render: (due: number) => (
        <Text type={due > 0 ? 'danger' : 'success'} strong>
          ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ),
      align: 'right' as const,
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
        const isClosed = ['paid', 'cancelled'].includes(record.status);
        const canLog = !isClosed && record.status !== 'draft';
        
        return (
          <Space size="middle">
            <Tooltip title="View Invoice">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => onView(record._id)} 
                style={{ color: '#0958d9' }}
              />
            </Tooltip>

            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                disabled={isClosed}
                onClick={() => onEdit(record)}
                style={{ color: isClosed ? undefined : '#faad14' }}
              />
            </Tooltip>

            {record.status === 'draft' && (
              <Tooltip title="Mark Sent">
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={() => onSend(record._id)}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
            )}

            {canLog && (
              <Tooltip title="Log Payment">
                <Button
                  type="text"
                  icon={<DollarOutlined />}
                  onClick={() => onLogPayment(record)}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
            )}

            <Tooltip title={record.amountPaid > 0 ? "Cannot delete since payments exist" : "Cancel Invoice (Delete)"}>
              <span>
                <Popconfirm
                  title="Are you sure you want to cancel this invoice?"
                  description="Status will change to Cancelled."
                  disabled={record.amountPaid > 0 || record.status === 'cancelled'}
                  onConfirm={() => onCancel(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={record.amountPaid > 0 || record.status === 'cancelled'}
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
        showTotal: (total) => `Total ${total} invoices`,
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
