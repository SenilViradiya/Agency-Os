'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Switch, Select, InputNumber, Alert, Space, Row, Col, Typography, message, App as AntdApp } from 'antd';
import { SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import apiClient from '@/lib/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function FinanceSettingsForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(false);
  const { message: msg } = AntdApp.useApp();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/finance/settings');
      if (res.data?.success && res.data.data) {
        form.setFieldsValue(res.data.data);
        setGstEnabled(res.data.data.gstEnabled || false);
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      const res = await apiClient.put('/finance/settings', values);
      if (res.data?.success) {
        msg.success(res.data.message || 'Settings updated successfully');
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={loading}
      initialValues={{
        gstEnabled: false,
        invoicePrefix: 'INV',
        quotationPrefix: 'QUO',
        defaultPaymentDueDays: 7,
        currency: 'INR',
        currencySymbol: '₹',
        companyAddress: { country: 'India' },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Card 1: Company Details */}
        <Card title="Company Details" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Company name is required' }]}>
                <Input placeholder="e.g. Acme Marketing Agency" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="companyLogo" label="Company Logo URL">
                <Input placeholder="Cloudinary URL or relative path" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="companyEmail" label="Company Email">
                <Input type="email" placeholder="billing@agency.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="companyPhone" label="Company Phone">
                <Input placeholder="+91 99999 99999" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" style={{ margin: '12px 0' }}><Text type="secondary">Billing Address</Text></Divider>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name={['companyAddress', 'street']} label="Street / Suite">
                <Input placeholder="123 Creative Street" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name={['companyAddress', 'city']} label="City">
                <Input placeholder="Mumbai" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name={['companyAddress', 'state']} label="State">
                <Input placeholder="Maharashtra" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['companyAddress', 'pincode']} label="Pincode / Postal Code">
                <Input placeholder="400001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['companyAddress', 'country']} label="Country">
                <Input placeholder="India" defaultValue="India" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Card 2: GST Settings */}
        <Card title="GST Settings" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Form.Item name="gstEnabled" label="GST Registered" valuePropName="checked">
              <Switch checked={gstEnabled} onChange={(val) => setGstEnabled(val)} />
            </Form.Item>

            {gstEnabled && (
              <>
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="gstNumber" 
                      label="GSTIN (GST Number)" 
                      rules={[{ required: gstEnabled, message: 'GST Number is required when GST is enabled' }]}
                    >
                      <Input placeholder="e.g. 27AAAAA1111A1Z1" style={{ textTransform: 'uppercase' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="gstType" label="GST Registration Type">
                      <Select placeholder="Select Registration Type">
                        <Select.Option value="regular">Regular</Select.Option>
                        <Select.Option value="composition">Composition Scheme</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Alert
                  message="GST Activation Warning"
                  description="Once enabled, GST calculations will apply to all invoices and quotations created after this timestamp. Existing invoices/quotations remain unchanged."
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                />
              </>
            )}
          </Space>
        </Card>

        {/* Card 3: Bank Details */}
        <Card title="Bank Details (for Invoice Footer)" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name={['bankDetails', 'accountName']} label="Account Holder Name">
                <Input placeholder="Acme Agency Private Limited" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
                <Input placeholder="HDFC Bank" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['bankDetails', 'accountNumber']} label="Account Number">
                <Input placeholder="50200001234567" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['bankDetails', 'ifscCode']} label="IFSC Code">
                <Input placeholder="HDFC0000123" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['bankDetails', 'branch']} label="Branch Location">
                <Input placeholder="Bandra East Branch" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="upiId" label="UPI ID (for quick payments)">
                <Input placeholder="acme@okaxis" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Card 4: Invoice Defaults */}
        <Card title="Invoice & Quotation Defaults" bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="invoicePrefix" label="Invoice Prefix" rules={[{ required: true }]}>
                <Input placeholder="INV" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="quotationPrefix" label="Quotation Prefix" rules={[{ required: true }]}>
                <Input placeholder="QUO" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="defaultPaymentDueDays" label="Default Due Days" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="invoiceTermsAndConditions" label="Default Terms & Conditions">
            <TextArea rows={4} placeholder="Payment is due within 7 days. Interest of 2% monthly will be charged on late invoices..." />
          </Form.Item>
          <Form.Item name="invoiceNotes" label="Default Invoice Footer Note">
            <TextArea rows={3} placeholder="Thank you for your business! For any issues, contact billing@agency.com." />
          </Form.Item>
          <Row gutter={24}>
            <Col xs={12}>
              <Form.Item name="currency" label="Currency Code">
                <Input placeholder="INR" defaultValue="INR" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="currencySymbol" label="Currency Symbol">
                <Input placeholder="₹" defaultValue="₹" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />} 
            loading={saving} 
            size="large"
            style={{ borderRadius: 8, height: 44, padding: '0 32px' }}
          >
            Save Settings
          </Button>
        </div>
      </Space>
    </Form>
  );
}

// Add a divider helper
const Divider = ({ children, orientation, style }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '24px 0', ...style }}>
    <div style={{ flex: orientation === 'left' ? '0 0 16px' : '1', height: 1, backgroundColor: '#f0f0f0' }} />
    {children && <span style={{ padding: '0 12px' }}>{children}</span>}
    <div style={{ flex: 1, height: 1, backgroundColor: '#f0f0f0' }} />
  </div>
);
