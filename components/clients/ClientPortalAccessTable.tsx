'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Tag, Typography, Spin, App } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import apiClient from '@/lib/apiClient';
import ResetPasswordModal from '@/components/shared/ResetPasswordModal';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ClientPortalAccessTableProps {
  clientId: string;
}

export default function ClientPortalAccessTable({ clientId }: ClientPortalAccessTableProps) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [portalUsers, setPortalUsers] = useState<any[]>([]);
  
  // Reset password modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchPortalUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/client-portal-users?clientId=${clientId}&limit=100`);
      if (res.data?.success) {
        setPortalUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load client portal users', err);
      message.error('Failed to load client portal users.');
    } finally {
      setLoading(false);
    }
  }, [clientId, message]);

  useEffect(() => {
    fetchPortalUsers();
  }, [fetchPortalUsers]);

  const handleResetPasswordClick = (user: any) => {
    setSelectedUser(user);
    setResetModalOpen(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      render: (text: string) => text || <Text type="secondary">—</Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            danger
            ghost
            icon={<KeyOutlined />}
            onClick={() => handleResetPasswordClick(record)}
          >
            Reset Password
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="Loading portal access users..." />
      </div>
    );
  }

  return (
    <div>
      <Table
        dataSource={portalUsers}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: 'No portal access configured for this client.' }}
      />

      {selectedUser && (
        <ResetPasswordModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          userId={selectedUser._id}
          userName={selectedUser.name}
          apiEndpoint="/api/admin/client-portal-users/[id]/reset-password"
          context="portal"
        />
      )}
    </div>
  );
}
