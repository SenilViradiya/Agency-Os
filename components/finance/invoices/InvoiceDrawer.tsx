'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, DatePicker, Select, Switch, Row, Col, Space, Divider, Typography, InputNumber, App as AntdApp } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface InvoiceDrawerProps {
  open: boolean;
  onClose: () => void;
  invoice: any | null; // Null if creating
  onSuccess: () => void;
}

export default function InvoiceDrawer({ open, onClose, invoice, onSuccess }: InvoiceDrawerProps) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [gstEnabled, setGstEnabled] = useState(false);

  // Watchers for calculations
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0, amount: 0, key: 0 }]);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  const fetchInitialData = async () => {
    try {
      const [clientsRes, settingsRes] = await Promise.all([
        apiClient.get('/clients?limit=100'),
        apiClient.get('/finance/settings'),
      ]);

      if (clientsRes.data?.success) setClients(clientsRes.data.data || []);
      if (settingsRes.data?.success && settingsRes.data.data) {
        setSettings(settingsRes.data.data);
        setGstEnabled(settingsRes.data.data.gstEnabled || false);
        
        if (!invoice) {
          form.setFieldsValue({
            notes: settingsRes.data.data.invoiceNotes,
            termsAndConditions: settingsRes.data.data.invoiceTermsAndConditions,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load standard settings:', error);
    }
  };

  const fetchClientProjects = async (clientId: string) => {
    try {
      const res = await apiClient.get(`/projects?clientId=${clientId}&limit=100`);
      if (res.data?.success) {
        setProjects(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load client projects:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchInitialData();
      if (invoice) {
        // Edit mode
        const itemsEnriched = (invoice.lineItems || []).map((item: any, idx: number) => ({
          ...item,
          key: idx,
        }));
        setLineItems(itemsEnriched);
        setDiscountType(invoice.discountType || null);
        setDiscountValue(invoice.discountValue || 0);
        setGstApplicable(invoice.gstApplicable || false);
        setGstRate(invoice.gstRate || 18);
        setSelectedClientId(invoice.clientId?._id || invoice.clientId);
        fetchClientProjects(invoice.clientId?._id || invoice.clientId);

        form.setFieldsValue({
          clientId: invoice.clientId?._id || invoice.clientId,
          projectId: invoice.projectId?._id || invoice.projectId,
          businessName: invoice.businessName,
          billingAddress: invoice.billingAddress,
          contactPerson: invoice.contactPerson,
          email: invoice.email,
          phone: invoice.phone,
          invoiceType: invoice.invoiceType,
          billingPeriod: invoice.billingPeriod,
          invoiceDate: dayjs(invoice.invoiceDate),
          dueDate: dayjs(invoice.dueDate),
          notes: invoice.notes,
          termsAndConditions: invoice.termsAndConditions,
        });
      } else {
        // Create mode
        form.resetFields();
        setLineItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0, key: 0 }]);
        setDiscountType(null);
        setDiscountValue(0);
        setGstApplicable(false);
        setGstRate(18);
        setSelectedClientId(null);
        setProjects([]);
      }
    }
  }, [open, invoice]);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = discountValue;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  let gstAmount = 0;
  if (gstApplicable && gstEnabled) {
    gstAmount = (taxableAmount * gstRate) / 100;
  }
  
  const totalAmount = taxableAmount + gstAmount;

  const handleClientChange = (val: string) => {
    setSelectedClientId(val);
    const client = clients.find((c) => c._id === val);
    if (client) {
      form.setFieldsValue({
        businessName: client.businessName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        billingAddress: client.address || {},
        projectId: null,
      });
      fetchClientProjects(val);
    }
  };

  const handleLineItemChange = (index: number, field: string, val: any) => {
    const updated = [...lineItems];
    updated[index][field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[index].quantity || 0);
      const p = Number(updated[index].unitPrice || 0);
      updated[index].amount = Number((q * p).toFixed(2));
    }
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unitPrice: 0, amount: 0, key: Date.now() },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      msg.warning('At least one line item is required');
      return;
    }
    const updated = lineItems.filter((_, idx) => idx !== index);
    setLineItems(updated);
  };

  const onFinishSubmit = async (values: any, publishStatus: 'draft' | 'sent') => {
    try {
      setSaving(true);
      // Validate line items
      const invalid = lineItems.some((item) => !item.description || item.unitPrice < 0);
      if (invalid) {
        msg.error('Please complete all line items with valid descriptions and price.');
        setSaving(false);
        return;
      }

      const payload = {
        ...values,
        lineItems: lineItems.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
        discountType,
        discountValue,
        gstApplicable,
        gstRate,
        status: invoice ? (values.status || 'draft') : publishStatus,
        invoiceDate: values.invoiceDate ? values.invoiceDate.toISOString() : undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      let res;
      if (invoice) {
        res = await apiClient.put(`/finance/invoices/${invoice._id}`, payload);
      } else {
        res = await apiClient.post('/finance/invoices', payload);
      }

      if (res.data?.success) {
        msg.success(res.data.message || 'Invoice saved successfully');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={invoice ? `Edit Invoice - ${invoice.invoiceNumber}` : 'Create New Invoice'}
      width={720}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="clientId" label="Client (Business)" rules={[{ required: true, message: 'Client is required' }]}>
              <Select
                showSearch
                placeholder="Select Client"
                optionFilterProp="children"
                onChange={handleClientChange}
                options={clients.map((c) => ({ value: c._id, label: c.businessName }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="projectId" label="Link to Project (Optional)">
              <Select
                showSearch
                allowClear
                disabled={!selectedClientId}
                placeholder="Select Project"
                optionFilterProp="children"
                options={projects.map((p) => ({ value: p._id, label: p.name }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>Contact Details</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="businessName" label="Business / Billing Name" rules={[{ required: true }]}>
              <Input placeholder="Client Company Co." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contactPerson" label="Contact Person" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="email" label="Contact Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>Billing Address</Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name={['billingAddress', 'street']} label="Street / Suite">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name={['billingAddress', 'city']} label="City">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name={['billingAddress', 'state']} label="State">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name={['billingAddress', 'pincode']} label="Pincode / Postal Code">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name={['billingAddress', 'country']} label="Country">
              <Input defaultValue="India" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>Billing Specifications</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="invoiceType" label="Invoice Type" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="retainer">Retainer</Select.Option>
                <Select.Option value="project">Project Work</Select.Option>
                <Select.Option value="milestone">Milestone Billing</Select.Option>
                <Select.Option value="custom">Custom Billing</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="billingPeriod" label="Billing Period (e.g. 2025-03)">
              <Input placeholder="YYYY-MM (Optional)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="invoiceDate" label="Invoice Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>Line Items</Divider>
        {lineItems.map((item, index) => (
          <Row gutter={12} key={item.key} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>Description</Text>
              <Input 
                value={item.description}
                placeholder="e.g. Campaign Creative Deliverables" 
                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
              />
            </Col>
            <Col span={4}>
              <Text type="secondary" style={{ fontSize: 11 }}>Qty</Text>
              <InputNumber 
                min={1} 
                value={item.quantity} 
                style={{ width: '100%' }}
                onChange={(val) => handleLineItemChange(index, 'quantity', val)}
              />
            </Col>
            <Col span={6}>
              <Text type="secondary" style={{ fontSize: 11 }}>Unit Price (₹)</Text>
              <InputNumber 
                min={0} 
                value={item.unitPrice} 
                style={{ width: '100%' }}
                onChange={(val) => handleLineItemChange(index, 'unitPrice', val)}
              />
            </Col>
            <Col span={2} style={{ paddingTop: 18 }}>
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveLineItem(index)} />
            </Col>
          </Row>
        ))}
        <Button type="dashed" onClick={handleAddLineItem} icon={<PlusOutlined />} style={{ width: '100%', marginBottom: 16 }}>
          Add Line Item
        </Button>

        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Discount Type">
              <Select value={discountType} onChange={(val) => { setDiscountType(val); setDiscountValue(0); }} allowClear placeholder="No Discount">
                <Select.Option value="percentage">Percentage (%)</Select.Option>
                <Select.Option value="fixed">Fixed Flat (₹)</Select.Option>
              </Select>
            </Form.Item>
            {discountType && (
              <Form.Item label={discountType === 'percentage' ? 'Percentage %' : 'Flat Value (₹)'}>
                <InputNumber min={0} value={discountValue} style={{ width: '100%' }} onChange={(val) => setDiscountValue(val || 0)} />
              </Form.Item>
            )}

            {gstEnabled && (
              <>
                <Form.Item label="Apply GST" valuePropName="checked" style={{ marginBottom: 8 }}>
                  <Switch checked={gstApplicable} onChange={(val) => setGstApplicable(val)} />
                </Form.Item>
                {gstApplicable && (
                  <Form.Item label="GST Rate (%)">
                    <Select value={gstRate} onChange={(val) => setGstRate(val)}>
                      <Select.Option value={5}>5%</Select.Option>
                      <Select.Option value={12}>12%</Select.Option>
                      <Select.Option value={18}>18%</Select.Option>
                      <Select.Option value={28}>28%</Select.Option>
                    </Select>
                  </Form.Item>
                )}
              </>
            )}
          </Col>
          <Col span={12} style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <Space direction="vertical" size={4} style={{ width: '100%', paddingRight: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Subtotal:</Text>
                <Text strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
                  <Text type="danger">Discount:</Text>
                  <Text type="danger">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
              )}
              {gstApplicable && gstEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1677ff' }}>
                  <Text type="secondary">GST Calculated ({gstRate}%):</Text>
                  <Text>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Total Amount:</Title>
                <Title level={4} style={{ margin: 0 }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
              </div>
            </Space>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>Notes & Terms</Divider>
        <Form.Item name="notes" label="Invoice Footer / Notes">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item name="termsAndConditions" label="Terms & Conditions">
          <TextArea rows={3} />
        </Form.Item>

        <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', borderTop: '1px solid #e9e9e9', padding: '10px 16px', background: '#fff', textAlign: 'right', zIndex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose} style={{ borderRadius: 6 }}>Cancel</Button>
          {!invoice ? (
            <>
              <Button type="default" onClick={() => form.validateFields().then(v => onFinishSubmit(v, 'draft'))} loading={saving} style={{ borderRadius: 6 }}>Draft Only</Button>
              <Button type="primary" icon={<SendOutlined />} onClick={() => form.validateFields().then(v => onFinishSubmit(v, 'sent'))} loading={saving} style={{ borderRadius: 6 }}>Save & Send</Button>
            </>
          ) : (
            <Button type="primary" icon={<SaveOutlined />} onClick={() => form.validateFields().then(v => onFinishSubmit(v, invoice.status))} loading={saving} style={{ borderRadius: 6 }}>Save Changes</Button>
          )}
        </div>
      </Form>
    </Drawer>
  );
}
