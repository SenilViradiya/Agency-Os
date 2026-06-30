'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, Select, Row, Col, Space, Divider, App as AntdApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import apiClient from '@/lib/apiClient';

interface VendorDrawerProps {
  open: boolean;
  onClose: () => void;
  vendor: any | null; // Null if creating
  onSuccess: () => void;
}

export default function VendorDrawer({ open, onClose, vendor, onSuccess }: VendorDrawerProps) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (vendor) {
        form.setFieldsValue({
          name: vendor.name,
          vendorType: vendor.vendorType,
          email: vendor.email,
          phone: vendor.phone,
          status: vendor.status,
          paymentMode: vendor.paymentMode || 'bank_transfer',
          bankDetails: vendor.bankDetails || {},
          upiId: vendor.upiId || '',
        });
      } else {
        form.setFieldsValue({
          vendorType: 'freelance_editor',
          paymentMode: 'bank_transfer',
          status: 'active',
        });
      }
    }
  }, [open, vendor]);

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      let res;
      if (vendor) {
        res = await apiClient.put(`/finance/vendors/${vendor._id}`, values);
      } else {
        res = await apiClient.post('/finance/vendors', values);
      }

      if (res.data?.success) {
        msg.success(res.data.message || 'Vendor saved successfully.');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to save vendor details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={vendor ? `Edit Vendor - ${vendor.name}` : 'Onboard New Vendor'}
      width={520}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Vendor / Freelancer Name" rules={[{ required: true, message: 'Vendor Name is required' }]}>
          <Input placeholder="e.g. Rahul Sharma" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="vendorType" label="Vendor type" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="freelance_editor">Freelance Editor</Select.Option>
                <Select.Option value="freelance_shooter">Freelance Shooter</Select.Option>
                <Select.Option value="freelance_designer">Freelance Designer</Select.Option>
                <Select.Option value="freelance_writer">Freelance Writer</Select.Option>
                <Select.Option value="studio">Studio</Select.Option>
                <Select.Option value="agency">Agency / Subcontractor</Select.Option>
                <Select.Option value="other">Other Partner</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Initial Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                <Select.Option value="upi">UPI ID</Select.Option>
                <Select.Option value="cheque">Cheque</Select.Option>
                <Select.Option value="cash">Cash</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Vendor Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="rahul@freelance.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="phone" label="Vendor Phone" rules={[{ required: true }]}>
              <Input placeholder="+91 99999 88888" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>Bank / Payout Details</Divider>
        <Form.Item name={['bankDetails', 'accountName']} label="Account Holder Name">
          <Input placeholder="Rahul Sharma" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
              <Input placeholder="ICICI Bank" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['bankDetails', 'ifscCode']} label="IFSC Code">
              <Input placeholder="ICIC0000123" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name={['bankDetails', 'accountNumber']} label="Account Number">
          <Input placeholder="1029384829384" />
        </Form.Item>

        <Form.Item name="upiId" label="UPI ID">
          <Input placeholder="rahul@okicici" />
        </Form.Item>

        <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', borderTop: '1px solid #e9e9e9', padding: '10px 16px', background: '#fff', textAlign: 'right', zIndex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Save Vendor</Button>
        </div>
      </Form>
    </Drawer>
  );
}
