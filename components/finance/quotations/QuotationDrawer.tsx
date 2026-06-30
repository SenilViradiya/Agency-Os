'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, DatePicker, Select, Switch, Row, Col, Space, Divider, Typography, InputNumber, Table, App as AntdApp } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface QuotationDrawerProps {
  open: boolean;
  onClose: () => void;
  quotation: any | null; // Null if creating
  onSuccess: () => void;
}

export default function QuotationDrawer({ open, onClose, quotation, onSuccess }: QuotationDrawerProps) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [gstEnabled, setGstEnabled] = useState(false);

  // Watchers for calculations
  const [type, setType] = useState<'lead' | 'client'>('lead');
  const [lineItems, setLineItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0, amount: 0, key: 0 }]);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  const fetchLeadsAndClients = async () => {
    try {
      const [leadsRes, clientsRes, settingsRes] = await Promise.all([
        apiClient.get('/leads?limit=100'),
        apiClient.get('/clients?limit=100'),
        apiClient.get('/finance/settings'),
      ]);

      if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      if (clientsRes.data?.success) setClients(clientsRes.data.data || []);
      if (settingsRes.data?.success && settingsRes.data.data) {
        setSettings(settingsRes.data.data);
        setGstEnabled(settingsRes.data.data.gstEnabled || false);
        
        // For new quotation, pre-fill notes and terms from settings
        if (!quotation) {
          form.setFieldsValue({
            notes: settingsRes.data.data.invoiceNotes,
            termsAndConditions: settingsRes.data.data.invoiceTermsAndConditions,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeadsAndClients();
      if (quotation) {
        // Edit mode
        const itemsEnriched = (quotation.lineItems || []).map((item: any, idx: number) => ({
          ...item,
          key: idx,
        }));
        setLineItems(itemsEnriched);
        setDiscountType(quotation.discountType || null);
        setDiscountValue(quotation.discountValue || 0);
        setGstApplicable(quotation.gstApplicable || false);
        setGstRate(quotation.gstRate || 18);
        setType(quotation.clientId ? 'client' : 'lead');

        form.setFieldsValue({
          targetType: quotation.clientId ? 'client' : 'lead',
          leadId: quotation.leadId?._id || quotation.leadId,
          clientId: quotation.clientId?._id || quotation.clientId,
          businessName: quotation.businessName,
          contactPerson: quotation.contactPerson,
          email: quotation.email,
          phone: quotation.phone,
          quotationDate: dayjs(quotation.quotationDate),
          validUntil: dayjs(quotation.validUntil),
          discountType: quotation.discountType,
          discountValue: quotation.discountValue,
          gstApplicable: quotation.gstApplicable,
          gstRate: quotation.gstRate,
          notes: quotation.notes,
          termsAndConditions: quotation.termsAndConditions,
        });
      } else {
        // Create mode
        form.resetFields();
        setLineItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0, key: 0 }]);
        setDiscountType(null);
        setDiscountValue(0);
        setGstApplicable(false);
        setGstRate(18);
        setType('lead');
      }
    }
  }, [open, quotation]);

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

  const handleTargetChange = (val: 'lead' | 'client') => {
    setType(val);
    form.setFieldsValue({ leadId: null, clientId: null, businessName: '', contactPerson: '', email: '', phone: '' });
  };

  const handleSelectEntity = (id: string) => {
    if (type === 'lead') {
      const lead = leads.find((l) => l._id === id);
      if (lead) {
        form.setFieldsValue({
          businessName: lead.businessName || lead.name,
          contactPerson: lead.name,
          email: lead.email,
          phone: lead.phone,
        });
      }
    } else {
      const client = clients.find((c) => c._id === id);
      if (client) {
        form.setFieldsValue({
          businessName: client.businessName,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
        });
      }
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
        status: quotation ? (values.status || 'draft') : publishStatus, // if create, default to publishStatus
        quotationDate: values.quotationDate ? values.quotationDate.toISOString() : undefined,
        validUntil: values.validUntil ? values.validUntil.toISOString() : undefined,
      };

      let res;
      if (quotation) {
        res = await apiClient.put(`/finance/quotations/${quotation._id}`, payload);
      } else {
        res = await apiClient.post('/finance/quotations', payload);
      }

      if (res.data?.success) {
        msg.success(res.data.message || 'Quotation saved successfully');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={quotation ? `Edit Quotation Details - ${quotation.quotationNumber}` : 'Create New Quotation'}
      width={720}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical" initialValues={{ targetType: 'lead' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="targetType" label="Link To Type">
              <Select onChange={handleTargetChange}>
                <Select.Option value="lead">Lead (Pre-Sale)</Select.Option>
                <Select.Option value="client">Existing Client</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            {type === 'lead' ? (
              <Form.Item name="leadId" label="Select Lead">
                <Select
                  showSearch
                  placeholder="Query Leads"
                  optionFilterProp="children"
                  onChange={handleSelectEntity}
                  options={leads.map((l) => ({ value: l._id, label: `${l.businessName || l.name} (${l.name})` }))}
                />
              </Form.Item>
            ) : (
              <Form.Item name="clientId" label="Select Client">
                <Select
                  showSearch
                  placeholder="Query Clients"
                  optionFilterProp="children"
                  onChange={handleSelectEntity}
                  options={clients.map((c) => ({ value: c._id, label: c.businessName }))}
                />
              </Form.Item>
            )}
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

        <Divider orientation={"left" as any}>Dates</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="quotationDate" label="Quotation Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="validUntil" label="Valid Until" rules={[{ required: true }]}>
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
                placeholder="e.g. SEO Campaign & YouTube Video Production" 
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
          {!quotation ? (
            <>
              <Button type="default" onClick={() => form.validateFields().then(v => onFinishSubmit(v, 'draft'))} loading={saving} style={{ borderRadius: 6 }}>Draft Only</Button>
              <Button type="primary" icon={<SendOutlined />} onClick={() => form.validateFields().then(v => onFinishSubmit(v, 'sent'))} loading={saving} style={{ borderRadius: 6 }}>Save & Send</Button>
            </>
          ) : (
            <Button type="primary" icon={<SaveOutlined />} onClick={() => form.validateFields().then(v => onFinishSubmit(v, quotation.status))} loading={saving} style={{ borderRadius: 6 }}>Save Changes</Button>
          )}
        </div>
      </Form>
    </Drawer>
  );
}
