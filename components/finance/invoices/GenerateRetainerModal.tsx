'use client';

import React, { useState } from 'react';
import { Modal, Form, DatePicker, message, Space, Typography, App as AntdApp } from 'antd';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;

interface GenerateRetainerModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function GenerateRetainerModal({ open, onCancel, onSuccess }: GenerateRetainerModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message: msg } = AntdApp.useApp();

  const handleGenerate = async (values: any) => {
    try {
      setLoading(true);
      const billingPeriod = values.billingMonth.format('YYYY-MM');

      const res = await apiClient.post('/finance/invoices/generate-retainer', { billingPeriod });

      if (res.data?.success) {
        Modal.success({
          title: 'Bulk Generation Report',
          content: (
            <Space direction="vertical">
              <Text>Retainer invoices processed for {values.billingMonth.format('MMMM YYYY')}:</Text>
              <Text strong style={{ color: '#52c41a' }}>Generated: {res.data.data.generated}</Text>
              <Text style={{ color: '#faad14' }}>Skipped (Already Exists): {res.data.data.skipped}</Text>
            </Space>
          ),
          onOk: () => {
            onSuccess();
            onCancel();
          }
        });
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to generate retainer invoices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Bulk Generate Retainer Invoices"
      open={open}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Generate Invoices"
      cancelText="Cancel"
      destroyOnHidden
    >
      <div style={{ padding: '10px 0' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          This will fetch all clients marked as <strong>Active</strong> who have a monthly retainer value greater than ₹0. It will create draft invoices for the selected billing period if they do not already exist.
        </Text>
        <Form form={form} onFinish={handleGenerate} layout="vertical">
          <Form.Item
            name="billingMonth"
            label="Select Billing Month"
            rules={[{ required: true, message: 'Billing month is required' }]}
            initialValue={dayjs()}
          >
            <DatePicker picker="month" format="MMMM YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
