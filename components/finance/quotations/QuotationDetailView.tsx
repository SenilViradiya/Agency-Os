'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Tag, Typography, Row, Col, Divider, Spin, message, App as AntdApp } from 'antd';
import { PrinterOutlined, EditOutlined, SendOutlined, RetweetOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Title, Text, Paragraph } = Typography;

interface QuotationDetailViewProps {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onConvertSuccess: () => void;
}

export default function QuotationDetailView({ id, onBack, onEdit, onConvertSuccess }: QuotationDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { message: msg } = AntdApp.useApp();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        apiClient.get(`/finance/quotations/${id}`),
        apiClient.get('/finance/settings'),
      ]);
      if (qRes.data?.success) setQuotation(qRes.data.data);
      if (sRes.data?.success) setSettings(sRes.data.data);
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to fetch quotation details');
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
      const res = await apiClient.put(`/finance/quotations/${id}`, {
        ...quotation,
        status: 'sent',
      });
      if (res.data?.success) {
        msg.success('Quotation marked as Sent successfully.');
        setQuotation(res.data.data);
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to update quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    try {
      setActionLoading(true);
      const res = await apiClient.post(`/finance/quotations/${id}/convert`);
      if (res.data?.success) {
        msg.success('Converted to Invoice Draft successfully.');
        onConvertSuccess();
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to convert quotation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading proposal..." />
      </div>
    );
  }

  if (!quotation) {
    return (
      <Card>
        <Text type="danger">Quotation not found.</Text>
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

  return (
    <div>
      {/* Action Bar (hidden during printing) */}
      <span className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Back to List
          </Button>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print Quotation
            </Button>
            {quotation.status !== 'converted' && (
              <Button icon={<EditOutlined />} type="dashed" onClick={onEdit}>
                Edit
              </Button>
            )}
            {quotation.status === 'draft' && (
              <Button icon={<SendOutlined />} type="primary" onClick={handleSend} loading={actionLoading}>
                Mark Sent
              </Button>
            )}
            {quotation.status === 'accepted' && (
              <Button icon={<RetweetOutlined />} type="primary" onClick={handleConvert} loading={actionLoading}>
                Convert to Invoice
              </Button>
            )}
          </Space>
        </div>
      </span>

      {/* Main Printable Container */}
      <div className="printable-area" style={{ background: '#fff', padding: '40px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', color: '#000' }}>
        {/* Style Tag to inject print media queries locally */}
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
            <Title level={1} style={{ margin: 0, fontWeight: 300, color: '#000' }}>QUOTATION</Title>
            <Text strong style={{ fontSize: 16 }}>{quotation.quotationNumber}</Text>
            <div style={{ marginTop: 12 }}>
              <Tag color={quotation.status === 'accepted' ? 'green' : quotation.status === 'converted' ? 'purple' : 'blue'}>
                {quotation.status.toUpperCase()}
              </Tag>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* Billing Info */}
        <Row justify="space-between" style={{ marginBottom: 40 }}>
          <Col span={12}>
            <Text type="secondary" style={{ display: 'block', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Quotation For:</Text>
            <Paragraph>
              <Text strong style={{ fontSize: 15 }}>{quotation.businessName}</Text>
              <br />
              <Text>{quotation.contactPerson}</Text>
              <br />
              <Text>{quotation.phone}</Text>
              <br />
              <Text>{quotation.email}</Text>
            </Paragraph>
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ display: 'block', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Details:</Text>
            <Table 
              showHeader={false}
              dataSource={[
                { key: 'Date', label: 'Quotation Date:', val: dayjs(quotation.quotationDate).format('DD MMM YYYY') },
                { key: 'Valid', label: 'Valid Until:', val: dayjs(quotation.validUntil).format('DD MMM YYYY') },
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
          dataSource={quotation.lineItems}
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
                <Text>₹{quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </div>
              {quotation.discountAmount > 0 && (
                <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0', color: '#ff4d4f' }}>
                  <Text type="danger">Discount:</Text>
                  <Text type="danger">-₹{quotation.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                </div>
              )}
              {quotation.gstApplicable && (
                <>
                  <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Text>CGST ({quotation.gstRate / 2}%):</Text>
                    <Text>₹{quotation.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </div>
                  <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Text>SGST ({quotation.gstRate / 2}%):</Text>
                    <Text>₹{quotation.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  </div>
                </>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px double #000' }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>Total Amount:</Title>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>₹{quotation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Title>
              </div>
            </div>
          </Col>
        </Row>

        {/* Terms and Notes Footer */}
        <div style={{ marginTop: 50, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
          {quotation.termsAndConditions && (
            <div style={{ marginBottom: 15 }}>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Terms & Conditions</Text>
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{quotation.termsAndConditions}</Text>
            </div>
          )}

          {quotation.notes && (
            <div>
              <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Notes</Text>
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{quotation.notes}</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
