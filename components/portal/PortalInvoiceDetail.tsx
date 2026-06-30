'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Table, Button, Space, Spin, Tag, Flex } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PortalInvoiceDetailProps {
    id: string;
}

export default function PortalInvoiceDetail({ id }: PortalInvoiceDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoiceData, setInvoiceData] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        apiClient.get(`/api/portal/invoices/${id}`)
            .then(res => {
                if (res.data?.success) {
                    setInvoiceData(res.data.data);
                }
            })
            .catch(err => {
                console.error('Failed to load invoice details', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading invoice..." />
            </div>
        );
    }

    if (!invoiceData) {
        return (
            <Card style={{ margin: 24, textAlign: 'center' }}>
                <Title level={4}>Access Denied or Invoice Not Found</Title>
                <Text type="secondary">This invoice does not exist or you do not have permission to view it.</Text>
                <div style={{ marginTop: 24 }}>
                    <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push('/portal/invoices')}>
                        Back to Invoices
                    </Button>
                </div>
            </Card>
        );
    }

    const { invoice, financeSettings } = invoiceData;

    const columns = [
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right' as const,
        },
        {
            title: 'Unit Price',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            align: 'right' as const,
            render: (price: number) => `₹${price.toLocaleString('en-IN')}`,
        },
        {
            title: 'Total',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right' as const,
            render: (total: number) => `₹${total.toLocaleString('en-IN')}`,
        },
    ];

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (val: number) => {
        return `₹${(val || 0).toLocaleString('en-IN')}`;
    };

    return (
        <div>
            {/* Print Hiding Wrapper for controls */}
            <div className="no-print" style={{ marginBottom: 20 }}>
                <Flex justify="space-between" align="center">
                    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push('/portal/invoices')} style={{ paddingLeft: 0, color: '#FF6584' }}>
                        Back to Invoices List
                    </Button>
                    <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ backgroundColor: '#FF6584', borderColor: '#FF6584' }}>
                        Print Invoice / Save PDF
                    </Button>
                </Flex>
            </div>

            {/* Printable Area */}
            <div className="printable-invoice">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .printable-invoice, .printable-invoice * {
                            visibility: visible;
                        }
                        .printable-invoice {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 0;
                            border: none;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}} />

                <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }}>
                    {/* Header */}
                    <Row justify="space-between" style={{ marginBottom: 40, borderBottom: '1px solid #f0f0f0', paddingBottom: 24 }}>
                        <Col>
                            <Title level={2} style={{ margin: 0, color: '#FF6584', fontWeight: 900 }}>INVOICE</Title>
                            <Text type="secondary">{invoice.invoiceNumber}</Text>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                            <Title level={4} style={{ margin: 0 }}>AgencyOS</Title>
                            <Text type="secondary" style={{ display: 'block' }}>advanced ERP solutions</Text>
                        </Col>
                    </Row>

                    {/* Meta details */}
                    <Row gutter={24} style={{ marginBottom: 40 }}>
                        <Col xs={12} sm={8}>
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Invoice Date</Text>
                            <Text strong>{dayjs(invoice.invoiceDate).format('DD MMM YYYY')}</Text>
                        </Col>
                        <Col xs={12} sm={8}>
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Due Date</Text>
                            <Text strong>{dayjs(invoice.dueDate).format('DD MMM YYYY')}</Text>
                        </Col>
                        <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Status</Text>
                            <Tag color={invoice.status === 'paid' ? 'success' : 'warning'} style={{ margin: 0, fontSize: 13, padding: '2px 8px' }}>
                                {invoice.status.toUpperCase()}
                            </Tag>
                        </Col>
                    </Row>

                    <Row gutter={24} style={{ marginBottom: 40 }}>
                        <Col span={12}>
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Billed To:</Text>
                            <Text strong style={{ fontSize: 16, display: 'block' }}>{invoice.businessName}</Text>
                            <Text type="secondary" style={{ display: 'block' }}>{invoice.contactPerson}</Text>
                            <Text type="secondary" style={{ display: 'block' }}>{invoice.email}</Text>
                            <Text type="secondary" style={{ display: 'block' }}>{invoice.phone}</Text>
                            {invoice.billingAddress && (
                                <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                    {invoice.billingAddress.street}, {invoice.billingAddress.city}, {invoice.billingAddress.state} - {invoice.billingAddress.pincode}
                                </Text>
                            )}
                        </Col>
                        
                        <Col span={12} style={{ textAlign: 'right' }}>
                            <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Total Amount Due:</Text>
                            <Title level={2} style={{ margin: 0, color: '#FF6584' }}>{formatCurrency(invoice.amountDue)}</Title>
                            <Text type="secondary">out of {formatCurrency(invoice.totalAmount)}</Text>
                        </Col>
                    </Row>

                    {/* Table items */}
                    <Table 
                        dataSource={invoice.lineItems} 
                        columns={columns} 
                        rowKey="_id"
                        pagination={false}
                        style={{ marginBottom: 40 }}
                    />

                    {/* Footer values layout */}
                    <Row justify="end" style={{ marginBottom: 40 }}>
                        <Col xs={24} sm={12} md={8}>
                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                <Flex justify="space-between">
                                    <Text type="secondary">Subtotal</Text>
                                    <Text>{formatCurrency(invoice.subtotal)}</Text>
                                </Flex>
                                {invoice.discountAmount > 0 && (
                                    <Flex justify="space-between">
                                        <Text type="secondary">Discount</Text>
                                        <Text>- {formatCurrency(invoice.discountAmount)}</Text>
                                    </Flex>
                                )}
                                {invoice.cgstAmount > 0 && (
                                    <Flex justify="space-between">
                                        <Text type="secondary">CGST ({invoice.gstRate / 2}%)</Text>
                                        <Text>{formatCurrency(invoice.cgstAmount)}</Text>
                                    </Flex>
                                )}
                                {invoice.sgstAmount > 0 && (
                                    <Flex justify="space-between">
                                        <Text type="secondary">SGST ({invoice.gstRate / 2}%)</Text>
                                        <Text>{formatCurrency(invoice.sgstAmount)}</Text>
                                    </Flex>
                                )}
                                {invoice.igstAmount > 0 && (
                                    <Flex justify="space-between">
                                        <Text type="secondary">IGST ({invoice.gstRate}%)</Text>
                                        <Text>{formatCurrency(invoice.igstAmount)}</Text>
                                    </Flex>
                                )}
                                <div style={{ borderTop: '2px solid #8c8c8c', paddingTop: 8, marginTop: 8 }}>
                                    <Flex justify="space-between">
                                        <Text strong style={{ fontSize: 16 }}>GRAND TOTAL</Text>
                                        <Text strong style={{ fontSize: 16 }}>{formatCurrency(invoice.totalAmount)}</Text>
                                    </Flex>
                                </div>
                                <Flex justify="space-between">
                                    <Text type="secondary">Amount Paid</Text>
                                    <Text>{formatCurrency(invoice.amountPaid)}</Text>
                                </Flex>
                                <Flex justify="space-between" style={{ backgroundColor: '#fffbe6', padding: '4px 8px', borderRadius: 4 }}>
                                    <Text strong>Balance Due</Text>
                                    <Text strong color="#fa8c16">{formatCurrency(invoice.amountDue)}</Text>
                                </Flex>
                            </Space>
                        </Col>
                    </Row>

                    {/* Bank Details section */}
                    {financeSettings?.bankDetails && (
                        <div style={{ backgroundColor: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid #f0f0f0' }}>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>Payment Options:</Text>
                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Space direction="vertical" size={2}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>BANK INSTANT TRANSFER</Text>
                                        <Text style={{ fontSize: 13 }}><strong>{financeSettings.bankDetails.bankName || 'HDFC Bank'}</strong></Text>
                                        <Text style={{ fontSize: 13 }}>A/C Name: {financeSettings.bankDetails.accountName}</Text>
                                        <Text style={{ fontSize: 13 }}>A/C No: {financeSettings.bankDetails.accountNumber}</Text>
                                        <Text style={{ fontSize: 13 }}>IFSC: {financeSettings.bankDetails.ifscCode}</Text>
                                    </Space>
                                </Col>
                                {financeSettings.upiId && (
                                    <Col xs={24} sm={12} style={{ borderLeft: '1px solid #e8e8e8', paddingLeft: 24 }}>
                                        <Space direction="vertical" size={2}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>UPI ID TRANSFER</Text>
                                            <Text style={{ fontSize: 14 }}><strong>{financeSettings.upiId}</strong></Text>
                                            <Text type="secondary" style={{ fontSize: 11, marginTop: 8 }}>Kindly update your account manager upon sending payment confirmation.</Text>
                                        </Space>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
