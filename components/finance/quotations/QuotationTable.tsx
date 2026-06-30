'use client';

import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Typography } from 'antd';
import { EyeOutlined, EditOutlined, SendOutlined, RetweetOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface QuotationTableProps {
  data: any[];
  loading: boolean;
  pagination: any;
  onTableChange: (pagination: any) => void;
  onView: (id: string) => void;
  onEdit: (record: any) => void;
  onSend: (id: string) => void;
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuotationTable({
  data,
  loading,
  pagination,
  onTableChange,
  onView,
  onEdit,
  onSend,
  onConvert,
  onDelete,
}: QuotationTableProps) {
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      draft: { color: 'default', label: 'Draft' },
      sent: { color: 'blue', label: 'Sent' },
      accepted: { color: 'green', label: 'Accepted' },
      rejected: { color: 'red', label: 'Rejected' },
      expired: { color: 'orange', label: 'Expired' },
      converted: { color: 'purple', label: 'Converted' },
    };

    const config = statusMap[status] || { color: 'default', label: status };
    return <Tag color={config.color} style={{ borderRadius: 6, fontWeight: 500 }}>{config.label.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: 'Quotation #',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
      render: (text: string, record: any) => (
        <Text strong style={{ color: '#6C63FF', cursor: 'pointer' }} onClick={() => onView(record._id)}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.contactPerson}</Text>
        </Space>
      ),
    },
    {
      title: 'Quotation Date',
      dataIndex: 'quotationDate',
      key: 'quotationDate',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => {
        const isConverted = record.status === 'converted';
        const isAccepted = record.status === 'accepted';
        
        return (
          <Space size="middle">
            <Tooltip title="View Quotation">
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
                disabled={isConverted}
                onClick={() => onEdit(record)}
                style={{ color: isConverted ? undefined : '#faad14' }}
              />
            </Tooltip>

            {record.status === 'draft' && (
              <Tooltip title="Mark as Sent">
                <Button
                  type="text"
                  icon={<SendOutlined />}
                  onClick={() => onSend(record._id)}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
            )}

            {isAccepted && (
              <Tooltip title="Convert to Invoice">
                <Button
                  type="text"
                  icon={<RetweetOutlined />}
                  onClick={() => onConvert(record._id)}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
            )}

            <Tooltip title={isConverted ? "Cannot delete converted quotation" : "Delete"}>
              <span>
                <Popconfirm
                  title="Are you sure you want to delete this quotation?"
                  description="This quotation will be soft-deleted."
                  disabled={isConverted}
                  onConfirm={() => onDelete(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={isConverted}
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
        showTotal: (total) => `Total ${total} quotations`,
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
