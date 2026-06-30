'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Tag, Typography, Row, Col, Divider, Spin, message, Descriptions, Popconfirm, App as AntdApp } from 'antd';
import { PrinterOutlined, EditOutlined, SendOutlined, DollarOutlined, ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Title, Text, Paragraph } = Typography;

interface InvoiceDetailViewProps {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onLogPayment: () => void;
  onPaymentDeleted: () => void;
  hasDeletePermission: boolean;
}

export default function InvoiceDetailView({
  id,
  onBack,
  onEdit,
  onLogPayment,
  onPaymentDeleted,
  hasDeletePermission,
}: InvoiceDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { message: msg } = AntdApp.useApp();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, settingsRes] = await Promise.all([
        apiClient.get(`/finance/invoices/${id}`),
        apiClient.get('/finance/settings'),
      ]);
      if (invRes.data?.success) {
        setInvoice(invRes.data.data.invoice);
        setPayments(invRes.data.data.payments || []);
      }
      if (settingsRes.data?.success) {
        setSettings(settingsRes.data.data);
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to fetch invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSend = async () => {
    try {
      setActionLoading(true);
      const res = await apiClient.post(`/finance/invoices/${id}/send`);
      if (res.data?.success) {
        msg.success('Invoice marked as Sent and manager notified.');
        setInvoice(res.data.data);
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      setActionLoading(true);
      const res = await apiClient.delete(`/finance/payments/${paymentId}`);
      if (res.data?.success) {
        msg.success(res.data.message || 'Payment deleted successfully');
        await fetchData(); // reload invoice balances and list
        onPaymentDeleted();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to delete payment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading invoice..." />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <Text type="danger">Invoice not found.</Text>
        <Button onClick={onBack}>Back to List</Button>
      </Card>
    );
  }

  const columns = [
    {
      title: 'Item / Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 150,
      align: 'right' as const,
      render: (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
  ];

  const paymentColumns = [
    {
      title: 'Payment #',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Payment Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (m: string) => <Tag color="blue">{m.replace('_', ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Reference # / Bank',
      key: 'reference',
      render: (_: any, record: any) => (
        <span>
          {record.referenceNumber || '-'}{' '}
          {record.bankName ? `(${record.bankName})` : ''}
        </span>
      ),
    },
    {
      title: 'Amt Paid',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => <Text strong style={{ color: '#52c41a' }}>₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      className: 'no-print',
      render: (_: any, record: any) => (
        <Popconfirm
          title="Delete this payment?"
          description="This will increase the invoice balance due and revert client revenue changes."
          onConfirm={() => handleDeletePayment(record._id)}
          okText="Delete"
          cancelText="Cancel"
          disabled={!hasDeletePermission}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={actionLoading}
            disabled={!hasDeletePermission}
          />
        </Popconfirm>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'partially_paid': return 'orange';
      case 'sent': return 'blue';
      case 'overdue': return 'red';
      case 'cancelled': return 'default';
      default: return 'blue';
    }
  };

  return (
    <div>
      {/* Action Bar (hidden in Print View) */}
      <span className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Back to List
          </Button>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print Invoice
            </Button>
            {!['paid', 'cancelled'].includes(invoice.status) && (
              <Button icon={<EditOutlined />} type="dashed" onClick={onEdit}>
                Edit
              </Button>
            )}
            {invoice.status === 'draft' && (
              <Button icon={<SendOutlined />} type="primary" onClick={handleSend} loading={actionLoading}>
                Mark Sent
              </Button>
            )}
            {!['paid', 'cancelled'].includes(invoice.status) && invoice.status !== 'draft' && (
              <Button icon={<DollarOutlined />} type="primary" style={{ background: '#52c41a' }} onClick={onLogPayment}>
                Log Payment
              </Button>
            )}
          </Space>
        </div>
      </span>

      {/* Main Card layout (Paper style) */}
      <div className="printable-area" style={{ background: '#fff', padding: '40px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', color: '#000' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: #fff !important;
              color: #000 !important;
            }
            .no-print {
              display: none !important;
            }
            .printable-area {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
            header, footer, aside, nav, .ant-layout-sider, .ant-layout-header {
              display: none !important;
            }
            .ant-layout-content {
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}} />

        {/* Invoice styled header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 40 }}>
          <Col>
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" style={{ height: 60, marginBottom: 12, objectFit: 'contain' }} />
            ) : (
              <Title level={2} style={{ margin: 0, color: '#6C63FF' }}>{settings?.companyName || 'AGENCY OS'}</Title>
            )}
            <Text type="secondary" style={{ display: 'block' }}>{settings?.companyAddress?.street}</Text>
            <Text type="secondary" style={{ display: 'block' }}>
              {settings?.companyAddress?.city}, {settings?.companyAddress?.state} - {settings?.companyAddress?.pincode}
            </Text>
            {settings?.companyEmail && <Text type="secondary" style={{ display: 'block' }}>Email: {settings.companyEmail}</Text>}
            {settings?.gstEnabled && settings?.gstNumber && (
              <Text strong style={{ display: 'block', marginTop: 4 }}>GSTIN: {settings.gstNumber}</Text>
            )}
          </Col>
          <Col style={{ textAlign: 'right' }}>
            <Title level={1} style={{ margin: 0, fontWeight: 300, color: '#000' }}>INVOICE</Title>
            <Text strong style={{ fontSize: 16 }}>{invoice.invoiceNumber}</Text>
            <div style={{ marginTop: 12 }}>
              <Tag color={getStatusColor(invoice.status)}>
                {invoice.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* Billing Info */}
        <Row justify="space-between" style={{ marginBottom: 40 }}>
          <Col span={12}>
            <Text type="secondary" style={{ display: 'block', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Bill To:</Text>
            <Paragraph>
              <Text strong style={{ fontSize: 15 }}>{invoice.businessName}</Text>
              <br />
              {invoice.billingAddress?.street && <><Text>{invoice.billingAddress.street}</Text><br /></>}
              {invoice.billingAddress?.city && <><Text>{invoice.billingAddress.city}, {invoice.billingAddress.state} - {invoice.billingAddress.pincode}</Text><br /></>}
              <Text>{invoice.contactPerson}</Text>
              <br />
              <Text>{invoice.phone}</Text>
              <br />
              <Text>{invoice.email}</Text>
            </Paragraph>
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ display: 'block', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Invoice Details:</Text>
            <Table 
              showHeader={false}
              dataSource={[
                { key: 'Date', label: 'Invoice Date:', val: dayjs(invoice.invoiceDate).format('DD MMM YYYY') },
                { key: 'Due', label: 'Due Date:', val: dayjs(invoice.dueDate).format('DD MMM YYYY') },
                { key: 'Type', label: 'Invoice Type:', val: invoice.invoiceType.toUpperCase() },
                ...(invoice.billingPeriod ? [{ key: 'Period', label: 'Billing Period:', val: invoice.billingPeriod }] : [])
              ]}
              columns={[
                { dataIndex: 'label', key: 'label', render: (t) => <Text type="secondary">{t}</Text> },
                { dataIndex: 'val', key: 'val', render: (t) => <Text strong>{t}</Text>, align: 'right' }
              ]}
              pagination={false}
              rowKey="key"
              size="small"
              bordered={false}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        {/* Items Table */}
        <Table
          dataSource={invoice.lineItems}
          columns={columns}
          pagination={false}
          rowKey="_id"
          size="middle"
          style={{ marginBottom: 30 }}
        />

        {/* Totals & Bank Details */}
        <Row justify="space-between" style={{ marginTop: 20 }}>
          <Col span={14}>
            {settings?.bankDetails?.accountNumber && (
              <Card size="small" title="Payment Bank Information" style={{ width: '90%', borderRadius: 8, background: '#fafafa' }}>
                <Text style={{ display: 'block' }}>Account Name: <Text strong>{settings.bankDetails.accountName}</Text></Text>
                <Text style={{ display: 'block' }}>Bank: <Text strong>{settings.bankDetails.bankName}</Text></Text>
                <Text style={{ display: 'block' }}>A/C Number: <Text strong>{settings.bankDetails.accountNumber}</Text></Text>
                <Text style={{ display: 'block' }}>IFSC Code: <Text strong>{settings.bankDetails.ifscCode}</Text></Text>
                {settings.upiId && <Text style={{ display: 'block', marginTop: 4 }}>UPI ID: <Text strong style={{ color: '#1677ff' }}>{settings.upiId}</Text></Text>}
              </Card>
            )}
          </Col>
          <Col span={10}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0' }}>
                <Text>Subtotal:</Text>
                <Text>₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </div>
              {invoice.discountAmount > 0 && (
                <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0', color: '#ff4d4f' }}>
                  <Text type="danger">Discount:</Text>
                  <Text type="danger">-₹{invoice.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
              )}
              {invoice.gstApplicable && (
                <>
                  <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Text>CGST ({invoice.gstRate / 2}%):</Text>
                    <Text>₹{invoice.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </div>
                  <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Text>SGST ({invoice.gstRate / 2}%):</Text>
                    <Text>₹{invoice.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </div>
                </>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0' }}>
                <Text>Total Amount:</Text>
                <Text strong>₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </div>
              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0', color: '#52c41a' }}>
                <Text>Amount Paid:</Text>
                <Text strong>₹{invoice.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px double #000' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Amount Due / Balance:</Title>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>₹{invoice.amountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
              </div>
            </div>
          </Col>
        </Row>

        {/* Payments Section */}
        {payments.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <Title level={4} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>Transaction History</Title>
            <Table
              dataSource={payments}
              columns={paymentColumns}
              pagination={false}
              rowKey="_id"
              size="small"
            />
          </div>
        )}

        {/* Terms and Notes Footer */}
        <div style={{ marginTop: 50, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
          {invoice.termsAndConditions && (
            <div style={{ marginBottom: 15 }}>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{invoice.termsAndConditions}</Text>
            </div>
          )}

          {invoice.notes && (
            <div>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Notes</Text>
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{invoice.notes}</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
