'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Space, Tag, Typography, Row, Col, Divider, Spin, Tabs, Statistic, Modal, Form, Select, Input, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/lib/apiClient';

const { Title, Text } = Typography;

interface VendorDetailViewProps {
  id: string;
  onBack: () => void;
  onLogBill: () => void;
  onEdit: () => void;
}

export default function VendorDetailView({ id, onBack, onLogBill, onEdit }: VendorDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('bills');

  // Mark Paid Modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [payForm] = Form.useForm();
  
  const { message: msg } = AntdApp.useApp();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorRes, billsRes] = await Promise.all([
        apiClient.get(`/finance/vendors/${id}`),
        apiClient.get(`/finance/vendor-bills?vendorId=${id}&limit=100`),
      ]);
      if (vendorRes.data?.success) setVendor(vendorRes.data.data);
      if (billsRes.data?.success) setBills(billsRes.data.data || []);
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to fetch vendor detailed profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleOpenPayModal = (bill: any) => {
    setSelectedBill(bill);
    payForm.resetFields();
    payForm.setFieldsValue({
      paymentMode: 'bank_transfer',
      referenceNumber: '',
    });
    setPayModalOpen(true);
  };

  const handleConfirmPayment = async (values: any) => {
    try {
      setSubmittingPayment(true);
      const res = await apiClient.put(`/finance/vendor-bills/${selectedBill._id}`, {
        action: 'mark_paid',
        paymentMode: values.paymentMode,
        referenceNumber: values.referenceNumber,
      });

      if (res.data?.success) {
        msg.success(res.data.message || 'Bill marked as paid.');
        setPayModalOpen(false);
        await fetchData(); // refresh stats and bill list
      }
    } catch (error: any) {
      msg.error(error.response?.data?.error || 'Failed to record bill payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading vendor ledger..." />
      </div>
    );
  }

  if (!vendor) {
    return (
      <Card>
        <Text type="danger">Vendor not found.</Text>
        <Button onClick={onBack}>Back to List</Button>
      </Card>
    );
  }

  const billColumns = [
    {
      title: 'Bill #',
      dataIndex: 'billNumber',
      key: 'billNumber',
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (d: string, record: any) => {
        const isOverdue = record.status === 'pending' && dayjs(d).isBefore(dayjs());
        return <Text type={isOverdue ? 'danger' : undefined}>{dayjs(d).format('DD MMM YYYY')}</Text>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (val: number) => <Text strong>₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'} style={{ borderRadius: 6 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleOpenPayModal(record)}
              style={{ background: '#52c41a', border: 'none', borderRadius: 4 }}
            >
              Mark Paid
            </Button>
          )}
          {record.attachmentUrl && (
            <a href={record.attachmentUrl} target="_blank" rel="noopener noreferrer">
              <Button size="small" type="text" icon={<FileTextOutlined />}>Receipt</Button>
            </a>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Back to list
        </Button>
        <Space>
          <Button type="dashed" onClick={onEdit}>
            Edit Vendor Profile
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onLogBill} disabled={vendor.status !== 'active'}>
            Log Vendor Bill
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Left Profile Sidebar */}
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: '0 0 4px 0' }}>{vendor.name}</Title>
              <Tag color={vendor.status === 'active' ? 'green' : 'red'}>{vendor.status.toUpperCase()}</Tag>
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">{vendor.vendorType.toUpperCase()}</Text>
              </div>
            </div>

            <Divider />

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Contact Email</Text>
                <Text strong>{vendor.email}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Contact Phone</Text>
                <Text strong>{vendor.phone}</Text>
              </div>

              {vendor.bankDetails?.accountNumber && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ fontSize: 13 }}>Payout Bank Information</Text>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Beneficiary Name</Text>
                    <Text>{vendor.bankDetails.accountName}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Bank Name</Text>
                    <Text>{vendor.bankDetails.bankName}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Account Number</Text>
                    <Text>{vendor.bankDetails.accountNumber}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>IFSC Code</Text>
                    <Text>{vendor.bankDetails.ifscCode}</Text>
                  </div>
                  {vendor.upiId && (
                    <div>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>UPI Address</Text>
                      <Text strong style={{ color: '#1677ff' }}>{vendor.upiId}</Text>
                    </div>
                  )}
                </>
              )}
            </Space>
          </Card>
        </Col>

        {/* Right Tabular Workspace */}
        <Col xs={24} lg={16}>
          {/* Stats Bar */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic title="Total Billed" value={vendor.totalBilled} precision={2} prefix="₹" />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic title="Total Paid" value={vendor.totalPaid} precision={2} prefix="₹" valueStyle={{ color: '#3f8600' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic title="Outstanding Dues" value={vendor.totalPending} precision={2} prefix="₹" valueStyle={{ color: '#cf1322' }} />
              </Card>
            </Col>
          </Row>

          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Tabs activeKey={activeTab} onChange={(t) => setActiveTab(t)}>
              <Tabs.TabPane tab="Expense Bills Ledger" key="bills">
                <Table
                  dataSource={bills}
                  columns={billColumns}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                  size="middle"
                />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Pay Bill Modal */}
      <Modal
        title="Record Bill Payout"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        confirmLoading={submittingPayment}
        onOk={() => payForm.submit()}
        okText="Log Payout"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 20 }}>
          {selectedBill && (
            <Text type="secondary">
              Confirm payment for <strong>{selectedBill.billNumber}</strong> ({selectedBill.description}) of amount{' '}
              <strong>₹{selectedBill.amount.toLocaleString('en-IN')}</strong>.
            </Text>
          )}
        </div>
        <Form form={payForm} layout="vertical" onFinish={handleConfirmPayment}>
          <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="bank_transfer">Bank Transfer (NEFT/IMPS)</Select.Option>
              <Select.Option value="upi">UPI ID</Select.Option>
              <Select.Option value="cheque">Cheque</Select.Option>
              <Select.Option value="cash">Cash Out of Hand</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="referenceNumber" label="Reference ID (Optional)">
            <Input placeholder="Txn ID or Cheque Referencing" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
