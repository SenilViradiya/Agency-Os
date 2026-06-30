'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, Typography, Card, Col, Row, Button, Space, Input, Select, DatePicker, App as AntdApp, Divider } from 'antd';
import {
  PieChartOutlined,
  FileTextOutlined,
  SolutionOutlined,
  DollarOutlined,
  SwapOutlined,
  TeamOutlined,
  SettingOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import apiClient from '@/lib/apiClient';
import PageHeader from '@/components/shared/PageHeader';

// Components
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import StatCard from '@/components/analytics/StatCard';
import ProfitabilityTable from '@/components/finance/profitability/ProfitabilityTable';
import QuotationTable from '@/components/finance/quotations/QuotationTable';
import QuotationDrawer from '@/components/finance/quotations/QuotationDrawer';
import QuotationDetailView from '@/components/finance/quotations/QuotationDetailView';
import InvoiceTable from '@/components/finance/invoices/InvoiceTable';
import InvoiceDrawer from '@/components/finance/invoices/InvoiceDrawer';
import InvoiceDetailView from '@/components/finance/invoices/InvoiceDetailView';
import GenerateRetainerModal from '@/components/finance/invoices/GenerateRetainerModal';
import LogPaymentDrawer from '@/components/finance/payments/LogPaymentDrawer';
import PaymentTable from '@/components/finance/payments/PaymentTable';
import ExpenseTable from '@/components/finance/expenses/ExpenseTable';
import ExpenseDrawer from '@/components/finance/expenses/ExpenseDrawer';
import VendorTable from '@/components/finance/vendors/VendorTable';
import VendorDrawer from '@/components/finance/vendors/VendorDrawer';
import VendorDetailView from '@/components/finance/vendors/VendorDetailView';
import VendorBillDrawer from '@/components/finance/vendor-bills/VendorBillDrawer';
import FinanceSettingsForm from '@/components/finance/settings/FinanceSettingsForm';

const { Title, Text } = Typography;

export default function FinanceDashboardPage() {
  const { data: session } = useSession();
  const { message: msg } = AntdApp.useApp();

  const isSuperAdmin = !!(session?.user && (session.user as any).role === 'Super Admin');
  const isManager = !!(session?.user && (
    (session.user as any).role === 'Super Admin' ||
    (session.user as any).role === 'Manager' ||
    (session.user as any).role === 'Admin'
  ));

  const [activeTab, setActiveTab] = useState('overview');

  // Filters & Global Dates
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('year'),
    dayjs(),
  ]);

  // Loading States
  const [loading, setLoading] = useState(false);

  // 1. Overview / Profitability state
  const [profitabilityData, setProfitabilityData] = useState<any>({ clients: [], summary: {}, profitByClient: [] });

  // 2. Invoices state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicePagination, setInvoicePagination] = useState({ total: 0, page: 1, limit: 10 });
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string | null>(null);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<string | null>(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<any | null>(null);
  const [retainerModalOpen, setRetainerModalOpen] = useState(false);

  // 3. Quotations state
  const [quotations, setQuotations] = useState<any[]>([]);
  const [quotationPagination, setQuotationPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<string | null>(null);
  const [selectedQuotationForDetail, setSelectedQuotationForDetail] = useState<string | null>(null);
  const [quotationDrawerOpen, setQuotationDrawerOpen] = useState(false);
  const [selectedQuotationForEdit, setSelectedQuotationForEdit] = useState<any | null>(null);

  // 4. Payments state
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentPagination, setPaymentPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentInvoiceLink, setPaymentInvoiceLink] = useState<any | null>(null);

  // 5. Expenses state
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensePagination, setExpensePagination] = useState({ total: 0, page: 1, limit: 10 });
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<any | null>(null);

  // 6. Vendors state
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorPagination, setVendorPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<any | null>(null);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<string | null>(null);
  const [vendorBillDrawerOpen, setVendorBillDrawerOpen] = useState(false);
  const [selectedVendorForBill, setSelectedVendorForBill] = useState<any | null>(null);

  // Fetch functions
  const fetchProfitability = async () => {
    try {
      setLoading(true);
      const startStr = dateRange[0].format('YYYY-MM-DD');
      const endStr = dateRange[1].format('YYYY-MM-DD');
      const res = await apiClient.get(`/finance/profitability?startDate=${startStr}&endDate=${endStr}`);
      if (res.data?.success) {
        setProfitabilityData(res.data.data);
      }
    } catch (err: any) {
      msg.error('Failed to load profitability data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/finance/invoices?page=${invoicePagination.page}&limit=${invoicePagination.limit}`;
      if (invoiceSearch) url += `&search=${invoiceSearch}`;
      if (invoiceStatusFilter) url += `&status=${invoiceStatusFilter}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setInvoices(res.data.data);
        setInvoicePagination(res.data.pagination || invoicePagination);
      }
    } catch (err) {
      msg.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      let url = `/finance/quotations?page=${quotationPagination.page}&limit=${quotationPagination.limit}`;
      if (quotationSearch) url += `&search=${quotationSearch}`;
      if (quotationStatusFilter) url += `&status=${quotationStatusFilter}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setQuotations(res.data.data);
        setQuotationPagination(res.data.pagination || quotationPagination);
      }
    } catch (err) {
      msg.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = `/finance/payments?page=${paymentPagination.page}&limit=${paymentPagination.limit}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setPayments(res.data.data);
        setPaymentPagination(res.data.pagination || paymentPagination);
      }
    } catch (err) {
      msg.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = `/finance/expenses?page=${expensePagination.page}&limit=${expensePagination.limit}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setExpenses(res.data.data);
        setExpensePagination(res.data.pagination || expensePagination);
      }
    } catch (err) {
      msg.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const url = `/finance/vendors?page=${vendorPagination.page}&limit=${vendorPagination.limit}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setVendors(res.data.data);
        setVendorPagination(res.data.pagination || vendorPagination);
      }
    } catch (err) {
      msg.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') fetchProfitability();
    else if (activeTab === 'invoices') fetchInvoices();
    else if (activeTab === 'quotations') fetchQuotations();
    else if (activeTab === 'payments') fetchPayments();
    else if (activeTab === 'expenses') fetchExpenses();
    else if (activeTab === 'vendors') fetchVendors();
  }, [activeTab, dateRange, invoicePagination.page, invoicePagination.limit, quotationPagination.page, quotationPagination.limit, paymentPagination.page, paymentPagination.limit, expensePagination.page, expensePagination.limit, vendorPagination.page, vendorPagination.limit]);

  // Invoice handlers
  const handleInvoiceTableChange = (pag: any) => {
    setInvoicePagination({
      ...invoicePagination,
      page: pag.current,
      limit: pag.pageSize,
    });
  };

  const handleSendInvoice = async (id: string) => {
    try {
      const res = await apiClient.post(`/finance/invoices/${id}/send`);
      if (res.data?.success) {
        msg.success('Invoice marked sent and notifications pushed.');
        fetchInvoices();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Send action failed');
    }
  };

  const handleCancelInvoice = async (id: string) => {
    try {
      const res = await apiClient.delete(`/finance/invoices/${id}`);
      if (res.data?.success) {
        msg.success('Invoice cancelled successfully.');
        fetchInvoices();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Cancel failed');
    }
  };

  // Quotation handlers
  const handleQuotationTableChange = (pag: any) => {
    setQuotationPagination({
      ...quotationPagination,
      page: pag.current,
      limit: pag.pageSize,
    });
  };

  const handleSendQuotation = async (id: string) => {
    try {
      const res = await apiClient.put(`/finance/quotations/${id}`, { status: 'sent' });
      if (res.data?.success) {
        msg.success('Quotation status set to Sent.');
        fetchQuotations();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Update failed');
    }
  };

  const handleConvertQuotation = async (id: string) => {
    try {
      const res = await apiClient.post(`/finance/quotations/${id}/convert`);
      if (res.data?.success) {
        msg.success('Converted to Invoice Draft successfully.');
        setActiveTab('invoices');
        fetchInvoices();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Convert failed');
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    try {
      const res = await apiClient.delete(`/finance/quotations/${id}`);
      if (res.data?.success) {
        msg.success('Quotation soft-deleted.');
        fetchQuotations();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Delete failed');
    }
  };

  // Payment handlers
  const handlePaymentDeleted = () => {
    fetchPayments();
    if (selectedInvoiceForDetail) fetchInvoices();
  };

  const handleGeneralPaymentDelete = async (paymentId: string) => {
    try {
      const res = await apiClient.delete(`/finance/payments/${paymentId}`);
      if (res.data?.success) {
        msg.success('Transaction logged reversed.');
        fetchPayments();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Payment reversal failed');
    }
  };

  // Expense handlers
  const handleApproveExpense = async (id: string) => {
    try {
      const res = await apiClient.put(`/finance/expenses/${id}`, { action: 'approve' });
      if (res.data?.success) {
        msg.success('Expense Approved.');
        fetchExpenses();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Action failed');
    }
  };

  const handleMarkPaidExpense = async (id: string) => {
    try {
      const res = await apiClient.put(`/finance/expenses/${id}`, { action: 'mark_paid' });
      if (res.data?.success) {
        msg.success('Expense marked as Paid.');
        fetchExpenses();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Action failed');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await apiClient.delete(`/finance/expenses/${id}`);
      if (res.data?.success) {
        msg.success('Expense deletion completed.');
        fetchExpenses();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Delete failed');
    }
  };

  // Vendor handlers
  const handleToggleVendorStatus = async (id: string, current: string) => {
    try {
      const target = current === 'active' ? 'inactive' : 'active';
      const res = await apiClient.put(`/finance/vendors/${id}`, { status: target });
      if (res.data?.success) {
        msg.success(`Vendor status modified to ${target}.`);
        fetchVendors();
      }
    } catch (e: any) {
      msg.error(e.response?.data?.error || 'Profile status shift failed');
    }
  };

  // Tab views
  const renderDetailOrList = (
    selectedId: string | null,
    detailViewComponent: React.ReactNode,
    listViewComponent: React.ReactNode
  ) => {
    if (selectedId) {
      return detailViewComponent;
    }
    return listViewComponent;
  };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Top Banner layout */}
      <Flex className="no-print" justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={12}>
        <PageHeader
          title="💰 Financial Dashboard"
          subtitle="Real-time agency cash flow, profit margins, Client billing & payouts"
        />
        {activeTab === 'overview' && (
          <DateRangeFilter
            defaultValue={dateRange}
            onChange={(dates) => setDateRange(dates)}
          />
        )}
      </Flex>

      {/* Tabs Layout */}
      <Tabs
        activeKey={activeTab}
        onChange={(val) => {
          setSelectedInvoiceForDetail(null);
          setSelectedQuotationForDetail(null);
          setSelectedVendorForDetail(null);
          setActiveTab(val);
        }}
        size="large"
        className="no-print"
        items={[
          {
            key: 'overview',
            label: (
              <span><PieChartOutlined />Overview & Profits</span>
            ),
            children: (
              <div>
                {/* Stats cards for current period */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} lg={5}>
                    <StatCard
                      title="Net Revenue Collected"
                      value={`₹${(profitabilityData.summary?.totalRevenue || 0).toLocaleString('en-IN')}`}
                      color="#52c41a"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={5}>
                    <StatCard
                      title="Direct Operational Costs"
                      value={`₹${(profitabilityData.summary?.totalCosts || 0).toLocaleString('en-IN')}`}
                      color="#cf1322"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={5}>
                    <StatCard
                      title="Estimated Profit"
                      value={`₹${(profitabilityData.summary?.totalProfit || 0).toLocaleString('en-IN')}`}
                      color="#1677ff"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={5}>
                    <StatCard
                      title="Margin (Avg)"
                      value={profitabilityData.summary?.avgProfitMargin ? `${profitabilityData.summary.avgProfitMargin.toFixed(1)}%` : '0%'}
                      color="#faad14"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={4}>
                    <StatCard
                      title="Client Dues (Pending)"
                      value={`₹${(profitabilityData.summary?.totalOutstanding || 0).toLocaleString('en-IN')}`}
                      color="#722ed1"
                    />
                  </Col>
                </Row>

                <Title level={4} style={{ marginBottom: 16 }}>Client Earnings & Margin Breakdown</Title>
                <ProfitabilityTable
                  data={profitabilityData.clients || []}
                  loading={loading}
                />
              </div>
            )
          },
          {
            key: 'invoices',
            label: (
              <span><FileTextOutlined />Invoices</span>
            ),
            children: renderDetailOrList(
              selectedInvoiceForDetail,
              <InvoiceDetailView
                id={selectedInvoiceForDetail!}
                onBack={() => setSelectedInvoiceForDetail(null)}
                onEdit={() => {
                  const target = invoices.find(i => i._id === selectedInvoiceForDetail);
                  if (target) {
                    setSelectedInvoiceForEdit(target);
                    setInvoiceDrawerOpen(true);
                  }
                }}
                onLogPayment={() => {
                  const target = invoices.find(i => i._id === selectedInvoiceForDetail);
                  if (target) {
                    setPaymentInvoiceLink(target);
                    setPaymentDrawerOpen(true);
                  }
                }}
                onPaymentDeleted={handlePaymentDeleted}
                hasDeletePermission={isManager}
              />,
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Space>
                    <Input
                      placeholder="Search Invoice #"
                      prefix={<SearchOutlined />}
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      onPressEnter={fetchInvoices}
                      style={{ width: 200 }}
                    />
                    <Select
                      placeholder="Status Filter"
                      onChange={setInvoiceStatusFilter}
                      allowClear
                      style={{ width: 155 }}
                      options={[
                        { label: 'Draft', value: 'draft' },
                        { label: 'Sent', value: 'sent' },
                        { label: 'Partially Paid', value: 'partially_paid' },
                        { label: 'Paid', value: 'paid' },
                        { label: 'Overdue', value: 'overdue' },
                        { label: 'Cancelled', value: 'cancelled' },
                      ]}
                    />
                    <Button onClick={fetchInvoices} icon={<ReloadOutlined />} />
                  </Space>
                  <Space>
                    {isManager && (
                      <Button icon={<SwapOutlined />} onClick={() => setRetainerModalOpen(true)}>
                        Bulk Retainers
                      </Button>
                    )}
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedInvoiceForEdit(null); setInvoiceDrawerOpen(true); }}>
                      Create Invoice
                    </Button>
                  </Space>
                </Flex>
                <InvoiceTable
                  data={invoices}
                  loading={loading}
                  pagination={invoicePagination}
                  onTableChange={handleInvoiceTableChange}
                  onView={setSelectedInvoiceForDetail}
                  onEdit={(record) => {
                    setSelectedInvoiceForEdit(record);
                    setInvoiceDrawerOpen(true);
                  }}
                  onSend={handleSendInvoice}
                  onLogPayment={(record) => {
                    setPaymentInvoiceLink(record);
                    setPaymentDrawerOpen(true);
                  }}
                  onCancel={handleCancelInvoice}
                />
              </div>
            )
          },
          {
            key: 'quotations',
            label: (
              <span><SolutionOutlined />Proposal Quotations</span>
            ),
            children: renderDetailOrList(
              selectedQuotationForDetail,
              <QuotationDetailView
                id={selectedQuotationForDetail!}
                onBack={() => setSelectedQuotationForDetail(null)}
                onEdit={() => {
                  const target = quotations.find(q => q._id === selectedQuotationForDetail);
                  if (target) {
                    setSelectedQuotationForEdit(target);
                    setQuotationDrawerOpen(true);
                  }
                }}
                onConvertSuccess={() => {
                  setSelectedQuotationForDetail(null);
                  setActiveTab('invoices');
                }}
              />,
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Space>
                    <Input
                      placeholder="Search Quotation #"
                      prefix={<SearchOutlined />}
                      value={quotationSearch}
                      onChange={(e) => setQuotationSearch(e.target.value)}
                      onPressEnter={fetchQuotations}
                      style={{ width: 200 }}
                    />
                    <Select
                      placeholder="Status Filter"
                      onChange={setQuotationStatusFilter}
                      allowClear
                      style={{ width: 140 }}
                      options={[
                        { label: 'Draft', value: 'draft' },
                        { label: 'Sent', value: 'sent' },
                        { label: 'Accepted', value: 'accepted' },
                        { label: 'Rejected', value: 'rejected' },
                        { label: 'Expired', value: 'expired' },
                        { label: 'Converted', value: 'converted' },
                      ]}
                    />
                    <Button onClick={fetchQuotations} icon={<ReloadOutlined />} />
                  </Space>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedQuotationForEdit(null); setQuotationDrawerOpen(true); }}>
                    Create Quotation
                  </Button>
                </Flex>
                <QuotationTable
                  data={quotations}
                  loading={loading}
                  pagination={quotationPagination}
                  onTableChange={handleQuotationTableChange}
                  onView={setSelectedQuotationForDetail}
                  onEdit={(record) => {
                    setSelectedQuotationForEdit(record);
                    setQuotationDrawerOpen(true);
                  }}
                  onSend={handleSendQuotation}
                  onConvert={handleConvertQuotation}
                  onDelete={handleDeleteQuotation}
                />
              </div>
            )
          },
          {
            key: 'payments',
            label: (
              <span><DollarOutlined />Client Receipts</span>
            ),
            children: (
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>Client Payments History</Title>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setPaymentInvoiceLink(null); setPaymentDrawerOpen(true); }}>
                    Log Payment receipt
                  </Button>
                </Flex>
                <PaymentTable
                  data={payments}
                  loading={loading}
                  pagination={paymentPagination}
                  onTableChange={(pag) => setPaymentPagination({ ...paymentPagination, page: pag.current, limit: pag.pageSize })}
                  onDelete={handleGeneralPaymentDelete}
                  hasDeletePermission={isManager}
                />
              </div>
            )
          },
          {
            key: 'expenses',
            label: (
              <span><SwapOutlined />Operational Expenses</span>
            ),
            children: (
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>Company Outward Expenses</Title>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedExpenseForEdit(null); setExpenseDrawerOpen(true); }}>
                    Record Expense
                  </Button>
                </Flex>
                <ExpenseTable
                  data={expenses}
                  loading={loading}
                  pagination={expensePagination}
                  onTableChange={(pag) => setExpensePagination({ ...expensePagination, page: pag.current, limit: pag.pageSize })}
                  onEdit={(record) => {
                    setSelectedExpenseForEdit(record);
                    setExpenseDrawerOpen(true);
                  }}
                  onApprove={handleApproveExpense}
                  onMarkPaid={handleMarkPaidExpense}
                  onDelete={handleDeleteExpense}
                  isManager={isManager}
                />
              </div>
            )
          },
          {
            key: 'vendors',
            label: (
              <span><TeamOutlined />Vendor Ledger</span>
            ),
            children: renderDetailOrList(
              selectedVendorForDetail,
              <VendorDetailView
                id={selectedVendorForDetail!}
                onBack={() => setSelectedVendorForDetail(null)}
                onLogBill={() => {
                  const target = vendors.find(v => v._id === selectedVendorForDetail);
                  setSelectedVendorForBill(target);
                  setVendorBillDrawerOpen(true);
                }}
                onEdit={() => {
                  const target = vendors.find(v => v._id === selectedVendorForDetail);
                  if (target) {
                    setSelectedVendorForEdit(target);
                    setVendorDrawerOpen(true);
                  }
                }}
              />,
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>Freelance & Agency partners profiles</Title>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedVendorForEdit(null); setVendorDrawerOpen(true); }}>
                    Onboard Vendor
                  </Button>
                </Flex>
                <VendorTable
                  data={vendors}
                  loading={loading}
                  pagination={vendorPagination}
                  onTableChange={(pag) => setVendorPagination({ ...vendorPagination, page: pag.current, limit: pag.pageSize })}
                  onView={setSelectedVendorForDetail}
                  onEdit={(record) => {
                    setSelectedVendorForEdit(record);
                    setVendorDrawerOpen(true);
                  }}
                  onLogBill={(record) => {
                    setSelectedVendorForBill(record);
                    setVendorBillDrawerOpen(true);
                  }}
                  onToggleStatus={handleToggleVendorStatus}
                />
              </div>
            )
          },
          {
            key: 'settings',
            label: (
              <span><SettingOutlined />Settings</span>
            ),
            children: (
              <div>
                {!isSuperAdmin ? (
                  <Card style={{ borderRadius: 12 }}>
                    <Text type="danger" style={{ fontWeight: 600 }}>Access Denied: Only Super Admins can customize organization billing tax and GST configs.</Text>
                  </Card>
                ) : (
                  <FinanceSettingsForm />
                )}
              </div>
            )
          }
        ]}
      />

      {/* Render selected printable details explicitly for print preview layout */}
      {selectedInvoiceForDetail && (
        <span className="only-print">
          <InvoiceDetailView
            id={selectedInvoiceForDetail}
            onBack={() => {}}
            onEdit={() => {}}
            onLogPayment={() => {}}
            onPaymentDeleted={() => {}}
            hasDeletePermission={false}
          />
        </span>
      )}
      {selectedQuotationForDetail && (
        <span className="only-print">
          <QuotationDetailView
            id={selectedQuotationForDetail}
            onBack={() => {}}
            onEdit={() => {}}
            onConvertSuccess={() => {}}
          />
        </span>
      )}

      {/* All Drawers and Modals */}
      <QuotationDrawer
        open={quotationDrawerOpen}
        onClose={() => { setQuotationDrawerOpen(false); setSelectedQuotationForEdit(null); }}
        quotation={selectedQuotationForEdit}
        onSuccess={fetchQuotations}
      />

      <InvoiceDrawer
        open={invoiceDrawerOpen}
        onClose={() => { setInvoiceDrawerOpen(false); setSelectedInvoiceForEdit(null); }}
        invoice={selectedInvoiceForEdit}
        onSuccess={fetchInvoices}
      />

      <GenerateRetainerModal
        open={retainerModalOpen}
        onCancel={() => setRetainerModalOpen(false)}
        onSuccess={fetchInvoices}
      />

      <LogPaymentDrawer
        open={paymentDrawerOpen}
        onClose={() => { setPaymentDrawerOpen(false); setPaymentInvoiceLink(null); }}
        invoice={paymentInvoiceLink}
        onSuccess={() => {
          fetchPayments();
          if (selectedInvoiceForDetail) {
            // refresh invoice detail view
            setSelectedInvoiceForDetail(null);
            setTimeout(() => setSelectedInvoiceForDetail(selectedInvoiceForDetail), 100);
          }
        }}
      />

      <ExpenseDrawer
        open={expenseDrawerOpen}
        onClose={() => { setExpenseDrawerOpen(false); setSelectedExpenseForEdit(null); }}
        expense={selectedExpenseForEdit}
        onSuccess={fetchExpenses}
      />

      <VendorDrawer
        open={vendorDrawerOpen}
        onClose={() => { setVendorDrawerOpen(false); setSelectedVendorForEdit(null); }}
        vendor={selectedVendorForEdit}
        onSuccess={() => {
          fetchVendors();
          if (selectedVendorForDetail) {
            // refresh vendor detail view
            setSelectedVendorForDetail(null);
            setTimeout(() => setSelectedVendorForDetail(selectedVendorForDetail), 100);
          }
        }}
      />

      <VendorBillDrawer
        open={vendorBillDrawerOpen}
        onClose={() => { setVendorBillDrawerOpen(false); setSelectedVendorForBill(null); }}
        vendor={selectedVendorForBill}
        onSuccess={() => {
          if (selectedVendorForDetail) {
            // refresh detail view
            setSelectedVendorForDetail(null);
            setTimeout(() => setSelectedVendorForDetail(selectedVendorForDetail), 100);
          }
        }}
      />

      {/* Print helpers styled CSS directly */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block !important;
          }
        }
        @media screen {
          .only-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}

// Add a quick check flex layout helper
const Flex = ({ children, justify, align, style, wrap, gap, className }: any) => (
  <div className={className} style={{ display: 'flex', justifyContent: justify, alignItems: align, flexWrap: wrap ? 'wrap' : 'nowrap', gap, ...style }}>
    {children}
  </div>
);
