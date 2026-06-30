'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, DatePicker, Select, InputNumber, Row, Col, Space, Divider, App as AntdApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { TextArea } = Input;

interface VendorBillDrawerProps {
  open: boolean;
  onClose: () => void;
  // If vendor is selected beforehand, pass details.
  vendor: any | null;
  onSuccess: () => void;
}

export default function VendorBillDrawer({ open, onClose, vendor, onSuccess }: VendorBillDrawerProps) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeVendors, setActiveVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const [vendorsRes, projectsRes] = await Promise.all([
        apiClient.get('/finance/vendors?limit=100'),
        apiClient.get('/projects?limit=100'),
      ]);

      if (vendorsRes.data?.success) {
        // filter active only
        const activeOnly = (vendorsRes.data.data || []).filter((v: any) => v.status === 'active');
        setActiveVendors(activeOnly);
      }
      if (projectsRes.data?.success) {
        setProjects(projectsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load assets list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLists();
      form.resetFields();
      if (vendor) {
        form.setFieldsValue({
          vendorId: vendor._id,
          billDate: dayjs(),
          dueDate: dayjs().add(7, 'day'),
        });
      } else {
        form.setFieldsValue({
          billDate: dayjs(),
          dueDate: dayjs().add(7, 'day'),
        });
      }
    }
  }, [open, vendor]);

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        billDate: values.billDate ? values.billDate.toISOString() : undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      const res = await apiClient.post('/finance/vendor-bills', payload);

      if (res.data?.success) {
        msg.success(res.data.message || 'Vendor bill recorded successfully.');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to record vendor bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Create Vendor Bill"
      width={480}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {vendor ? (
          <Form.Item label="Vendor Partner">
            <Input value={vendor.name} disabled />
            <Form.Item name="vendorId" hidden><Input /></Form.Item>
          </Form.Item>
        ) : (
          <Form.Item 
            name="vendorId" 
            label="Select active Vendor" 
            rules={[{ required: true, message: 'Select a vendor partner' }]}
          >
            <Select
              showSearch
              placeholder="Search vendor profile"
              optionFilterProp="children"
              loading={loading}
              options={activeVendors.map((v) => ({ value: v._id, label: v.name }))}
            />
          </Form.Item>
        )}

        <Form.Item name="projectId" label="Link to Project (Optional)">
          <Select
            showSearch
            allowClear
            placeholder="Select Project scope"
            optionFilterProp="children"
            options={projects.map((p) => ({ value: p._id, label: p.name }))}
          />
        </Form.Item>

        <Form.Item 
          name="description" 
          label="Bill / Service Description" 
          rules={[{ required: true, message: 'Description is required' }]}
        >
          <Input placeholder="e.g. Design consulting or Copywriting milestone" />
        </Form.Item>

        <Form.Item 
          name="amount" 
          label="Bill Amount (₹)" 
          rules={[
            { required: true, message: 'Amount is required' },
            { type: 'number', min: 0.1, message: 'Amount must be positive' }
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0.1} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="billDate" label="Bill Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="attachmentUrl" label="Invoice PDF / File URL">
          <Input placeholder="URL link to vendor bill invoice" />
        </Form.Item>

        <Form.Item name="notes" label="Inner Notes">
          <TextArea rows={3} placeholder="Billed for 20 hours of work on design..." />
        </Form.Item>

        <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', borderTop: '1px solid #e9e9e9', padding: '10px 16px', background: '#fff', textAlign: 'right', zIndex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Log Vendor Bill</Button>
        </div>
      </Form>
    </Drawer>
  );
}
