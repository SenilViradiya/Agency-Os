'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, DatePicker, Select, Switch, Row, Col, Space, Divider, InputNumber, App as AntdApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { TextArea } = Input;

interface ExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  expense: any | null; // Null if creating
  onSuccess: () => void;
}

export default function ExpenseDrawer({ open, onClose, expense, onSuccess }: ExpenseDrawerProps) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);

  const fetchLists = async () => {
    try {
      const [clientsRes, projectsRes] = await Promise.all([
        apiClient.get('/clients?limit=100'),
        apiClient.get('/projects?limit=100'),
      ]);
      if (clientsRes.data?.success) setClients(clientsRes.data.data || []);
      if (projectsRes.data?.success) setProjects(projectsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load relations list:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLists();
      form.resetFields();
      if (expense) {
        setIsRecurring(expense.isRecurring || false);
        form.setFieldsValue({
          title: expense.title,
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          expenseDate: dayjs(expense.expenseDate),
          projectId: expense.projectId?._id || expense.projectId,
          clientId: expense.clientId?._id || expense.clientId,
          paymentMode: expense.paymentMode,
          receiptUrl: expense.receiptUrl,
          isRecurring: expense.isRecurring,
          recurringFrequency: expense.recurringFrequency,
          notes: expense.notes,
        });
      } else {
        setIsRecurring(false);
        form.setFieldsValue({
          expenseDate: dayjs(),
          paymentMode: 'bank_transfer',
          isRecurring: false,
        });
      }
    }
  }, [open, expense]);

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        expenseDate: values.expenseDate ? values.expenseDate.toISOString() : undefined,
      };

      let res;
      if (expense) {
        res = await apiClient.put(`/finance/expenses/${expense._id}`, payload);
      } else {
        res = await apiClient.post('/finance/expenses', payload);
      }

      if (res.data?.success) {
        msg.success(res.data.message || 'Expense tracked successfully.');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={expense ? `Edit Expense Details - ${expense.expenseNumber}` : 'Record New Expense'}
      width={520}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="title" label="Expense Title" rules={[{ required: true, message: 'Title is required' }]}>
          <Input placeholder="e.g. Creator License Renewal" />
        </Form.Item>

        <Form.Item name="description" label="Detailed Description">
          <Input placeholder="Adobe Creative Suite for design team..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select placeholder="Select Category">
                <Select.Option value="equipment">Equipment</Select.Option>
                <Select.Option value="software_subscription">Software / Subscriptions</Select.Option>
                <Select.Option value="travel">Travel</Select.Option>
                <Select.Option value="shoot_location">Shoot Location</Select.Option>
                <Select.Option value="office_rent">Office Rent</Select.Option>
                <Select.Option value="utilities">Utilities</Select.Option>
                <Select.Option value="marketing">Marketing campaigns</Select.Option>
                <Select.Option value="salary">Salary / Freelance Pay</Select.Option>
                <Select.Option value="vendor_payment">Vendor billing costs</Select.Option>
                <Select.Option value="misc">Miscellaneous</Select.Option>
                <Select.Option value="other">Other Expense</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="amount" 
              label="Amount Paid (₹)" 
              rules={[
                { required: true, message: 'Amount is required' },
                { type: 'number', min: 0.1, message: 'Amount must be positive' }
              ]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="expenseDate" label="Date of Expense" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="paymentMode" label="Payment Channel" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                <Select.Option value="upi">UPI Card/Scanner</Select.Option>
                <Select.Option value="cheque">Cheque</Select.Option>
                <Select.Option value="cash">Cash Out of Hand</Select.Option>
                <Select.Option value="other">Other Channel</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}><Text style={{ fontSize: 13 }} type="secondary">Link to Scope</Text></Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="clientId" label="Link to Client (Optional)">
              <Select
                showSearch
                allowClear
                placeholder="Query Client"
                optionFilterProp="children"
                options={clients.map((c) => ({ value: c._id, label: c.businessName }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="projectId" label="Link to Project (Optional)">
              <Select
                showSearch
                allowClear
                placeholder="Query Project"
                optionFilterProp="children"
                options={projects.map((p) => ({ value: p._id, label: p.name }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="isRecurring" label="Recurring Expense" valuePropName="checked">
              <Switch checked={isRecurring} onChange={(val) => setIsRecurring(val)} />
            </Form.Item>
          </Col>
          {isRecurring && (
            <Col span={12}>
              <Form.Item name="recurringFrequency" label="Frequency" rules={[{ required: isRecurring, message: 'Frequency is required' }]}>
                <Select placeholder="Recurrence Interval">
                  <Select.Option value="monthly">Monthly</Select.Option>
                  <Select.Option value="quarterly">Quarterly</Select.Option>
                  <Select.Option value="yearly">Yearly</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item name="receiptUrl" label="Receipt Attachment URL">
          <Input placeholder="Link to receipt file or photo" />
        </Form.Item>

        <Form.Item name="notes" label="Quick Notes">
          <TextArea rows={3} placeholder="Approved in slack channel #finance..." />
        </Form.Item>

        <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', borderTop: '1px solid #e9e9e9', padding: '10px 16px', background: '#fff', textAlign: 'right', zIndex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Record Expense</Button>
        </div>
      </Form>
    </Drawer>
  );
}

const Text = ({ children, style, type }: any) => {
  let color = 'inherit';
  if (type === 'secondary') color = '#999';
  return <span style={{ color, ...style }}>{children}</span>;
};
