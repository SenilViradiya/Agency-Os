'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, DatePicker, Select, InputNumber, Alert, Space, Typography, message, App as AntdApp } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;
const { TextArea } = Input;

interface LogPaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  // If invoice is passed, it logs payment for that specific invoice. Otherwise, lets the user select.
  invoice: any | null; 
  onSuccess: () => void;
}

export default function LogPaymentDrawer({ open, onClose, invoice, onSuccess }: LogPaymentDrawerProps) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [maxAmount, setMaxAmount] = useState<number>(0);

  const fetchUnpaidInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/finance/invoices?limit=100');
      if (res.data?.success) {
        // Filter client-side for safety or display options
        const options = (res.data.data || []).filter(
          (inv: any) => ['sent', 'partially_paid', 'overdue'].includes(inv.status)
        );
        setInvoices(options);
      }
    } catch (error) {
      console.error('Failed to load unpaid invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (invoice) {
        setSelectedInvoice(invoice);
        setMaxAmount(invoice.amountDue);
        form.setFieldsValue({
          invoiceId: invoice._id,
          amount: invoice.amountDue,
          paymentDate: dayjs(),
          paymentMode: 'bank_transfer',
        });
      } else {
        setSelectedInvoice(null);
        setMaxAmount(0);
        fetchUnpaidInvoices();
        form.setFieldsValue({
          paymentDate: dayjs(),
          paymentMode: 'bank_transfer',
        });
      }
    }
  }, [open, invoice]);

  const handleInvoiceSelect = (val: string) => {
    const inv = invoices.find((i) => i._id === val);
    setSelectedInvoice(inv || null);
    if (inv) {
      setMaxAmount(inv.amountDue);
      form.setFieldsValue({
        amount: inv.amountDue,
      });
    } else {
      setMaxAmount(0);
      form.setFieldsValue({
        amount: 0,
      });
    }
  };

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        paymentDate: values.paymentDate ? values.paymentDate.toISOString() : undefined,
      };

      const res = await apiClient.post('/finance/payments', payload);

      if (res.data?.success) {
        msg.success(res.data.message || 'Payment logged successfully.');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to log payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Log Invoice Payment"
      width={480}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {invoice ? (
          <Form.Item label="Target Invoice">
            <Input value={`${invoice.invoiceNumber} - ${invoice.businessName}`} disabled />
            <Form.Item name="invoiceId" hidden><Input /></Form.Item>
          </Form.Item>
        ) : (
          <Form.Item 
            name="invoiceId" 
            label="Select Pending Invoice" 
            rules={[{ required: true, message: 'Select an invoice to log payment' }]}
          >
            <Select
              showSearch
              placeholder="Search Invoice Number or Business"
              onChange={handleInvoiceSelect}
              loading={loading}
              options={invoices.map((inv) => ({
                value: inv._id,
                label: `${inv.invoiceNumber} - ${inv.businessName} (Due: ₹${inv.amountDue.toLocaleString('en-IN')})`,
              }))}
            />
          </Form.Item>
        )}

        {selectedInvoice && (
          <Alert
            message={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text>Total Bill: ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</Text>
                <Text>Already Paid: ₹{selectedInvoice.amountPaid.toLocaleString('en-IN')}</Text>
                <Text strong>Balance Due: ₹{selectedInvoice.amountDue.toLocaleString('en-IN')}</Text>
              </div>
            }
            type="info"
            style={{ marginBottom: 20 }}
          />
        )}

        <Form.Item 
          name="amount" 
          label="Amount Received (₹)" 
          rules={[
            { required: true, message: 'Amount is required' },
            { type: 'number', min: 0.1, message: 'Amount must be greater than zero' }
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            max={maxAmount} 
            formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/₹\s?|(,*)/g, '') as any}
          />
        </Form.Item>

        <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true, message: 'Date is required' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="paymentMode" label="Payment Method" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="bank_transfer">Bank Transfer (NEFT/IMPS)</Select.Option>
            <Select.Option value="upi">UPI (GPay/PhonePe/etc.)</Select.Option>
            <Select.Option value="cheque">Cheque</Select.Option>
            <Select.Option value="cash">Cash</Select.Option>
            <Select.Option value="other">Other Mode</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="referenceNumber" label="Reference Number (Txn ID / Cheque No.)">
          <Input placeholder="e.g. TXN-1029384729" />
        </Form.Item>

        <Form.Item name="bankName" label="Sender Bank Name (e.g. ICICI)">
          <Input placeholder="e.g. State Bank of India" />
        </Form.Item>

        <Form.Item name="attachmentUrl" label="Payment Receipt Image/PDF URL">
          <Input placeholder="URL to receipt file" />
        </Form.Item>

        <Form.Item name="notes" label="Transaction Notes">
          <TextArea rows={3} placeholder="Customer logged payment from GPay..." />
        </Form.Item>

        <div style={{ position: 'absolute', right: 0, bottom: 0, width: '100%', borderTop: '1px solid #e9e9e9', padding: '10px 16px', background: '#fff', textAlign: 'right', zIndex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Log Payment</Button>
        </div>
      </Form>
    </Drawer>
  );
}
