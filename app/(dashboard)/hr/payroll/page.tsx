'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Space, Flex, Select, Table, Tag, App, Spin, Card, Row, Col, Input, Modal, InputNumber, Drawer, Descriptions, Divider, Badge,
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const statusColors: Record<string, string> = { draft: 'default', approved: 'blue', paid: 'green' };

export default function PayrollPage() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
    const [generateOpen, setGenerateOpen] = useState(false);
    const [payslipOpen, setPayslipOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [variablePayMap, setVariablePayMap] = useState<Record<string, { variablePay: number; variableReason: string; otherDeductions: number; deductionReason: string }>>({});
    const [generateLoading, setGenerateLoading] = useState(false);
    const [markPaidModal, setMarkPaidModal] = useState<{ open: boolean; payroll: any }>({ open: false, payroll: null });
    const [transactionId, setTransactionId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');
    const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

    const fetchPayrolls = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/hr/payroll?month=${month}&limit=50`;
            const res = await apiClient.get(url);
            if (res.data.success) setPayrolls(res.data.data);
        } catch { message.error('Failed to load payrolls'); } finally { setLoading(false); }
    }, [month, message]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await apiClient.get('/hr/employees?limit=100&status=active');
            if (res.data.success) setEmployees(res.data.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

    const totalAmount = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0);
    const paidCount = payrolls.filter(p => p.status === 'paid').length;
    const pendingCount = payrolls.filter(p => p.status === 'approved').length;
    const draftCount = payrolls.filter(p => p.status === 'draft').length;

    const handleGenerate = async () => {
        if (selectedEmployees.length === 0) { message.warning('Select at least one employee'); return; }
        setGenerateLoading(true);
        let successCount = 0;
        let errorMessages: string[] = [];
        for (const empId of selectedEmployees) {
            try {
                const vpData = variablePayMap[empId] || { variablePay: 0, variableReason: '', otherDeductions: 0, deductionReason: '' };
                await apiClient.post('/hr/payroll', {
                    employeeId: empId,
                    month,
                    ...vpData,
                });
                successCount++;
            } catch (error: any) {
                errorMessages.push(error.response?.data?.error || `Failed for ${empId}`);
            }
        }
        if (successCount > 0) message.success(`${successCount} payslip(s) generated`);
        if (errorMessages.length > 0) message.error(errorMessages.join('; '));
        setGenerateOpen(false);
        setSelectedEmployees([]);
        setVariablePayMap({});
        fetchPayrolls();
        setGenerateLoading(false);
    };

    const handleApprove = async (payrollId: string) => {
        try {
            const res = await apiClient.put(`/hr/payroll/${payrollId}`, { action: 'approve' });
            if (res.data.success) { message.success('Payroll approved'); fetchPayrolls(); }
        } catch (error: any) { message.error(error.response?.data?.error || 'Failed'); }
    };

    const handleMarkPaid = async () => {
        if (!transactionId.trim()) { message.warning('Transaction ID is required'); return; }
        setActionLoading(true);
        try {
            const res = await apiClient.put(`/hr/payroll/${markPaidModal.payroll._id}`, {
                action: 'mark_paid',
                transactionId,
                paidAt: new Date().toISOString(),
            });
            if (res.data.success) { message.success('Marked as paid'); setMarkPaidModal({ open: false, payroll: null }); setTransactionId(''); fetchPayrolls(); }
        } catch (error: any) { message.error(error.response?.data?.error || 'Failed'); } finally { setActionLoading(false); }
    };

    const viewPayslip = async (payrollId: string) => {
        try {
            const res = await apiClient.get(`/hr/payroll/${payrollId}`);
            if (res.data.success) { setSelectedPayroll(res.data.data); setPayslipOpen(true); }
        } catch { message.error('Failed to load payslip'); }
    };

    const columns = [
        { title: 'PAY#', dataIndex: 'payrollNumber', key: 'payrollNumber', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
        {
            title: 'Employee', key: 'employee',
            render: (_: any, rec: any) => {
                const emp = rec.employeeId;
                return <Text strong>{typeof emp === 'object' ? emp?.fullName : '—'}</Text>;
            },
        },
        { title: 'Department', key: 'department', render: (_: any, rec: any) => <Tag>{typeof rec.employeeId === 'object' ? rec.employeeId?.department : '—'}</Tag> },
        { title: 'Working', dataIndex: 'workingDays', key: 'workingDays', width: 70 },
        { title: 'Present', dataIndex: 'presentDays', key: 'presentDays', width: 70 },
        { title: 'Gross', dataIndex: 'grossSalary', key: 'grossSalary', render: (v: number) => formatCurrency(v) },
        { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => <Text type="danger">{formatCurrency(v)}</Text> },
        { title: 'Net Salary', dataIndex: 'netSalary', key: 'netSalary', render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text> },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
        {
            title: 'Actions', key: 'actions', width: 160,
            render: (_: any, rec: any) => (
                <Space>
                    {rec.status === 'draft' && <Button size="small" type="primary" onClick={() => handleApprove(rec._id)}>Approve</Button>}
                    {rec.status === 'approved' && <Button size="small" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }} onClick={() => { setMarkPaidModal({ open: true, payroll: rec }); setTransactionId(''); }}>Mark Paid</Button>}
                    <Button size="small" icon={<EyeOutlined />} onClick={() => viewPayslip(rec._id)}>Payslip</Button>
                </Space>
            ),
        },
    ];

    const existingEmpIds = payrolls.map(p => typeof p.employeeId === 'object' ? p.employeeId?._id : p.employeeId);
    const availableEmployees = employees.filter(e => !existingEmpIds.includes(e._id));

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <PageHeader title="Payroll" subtitle={dayjs(month).format('MMMM YYYY')} />
                <Space>
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 180 }} />
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { setSelectedEmployees([]); setVariablePayMap({}); setGenerateOpen(true); }}>
                        Generate Payroll
                    </Button>
                </Space>
            </Flex>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} md={6}><Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}><Text type="secondary" style={{ fontSize: 11 }}>Total Amount</Text><Title level={4} style={{ margin: 0, color: '#6C63FF' }}>{formatCurrency(totalAmount)}</Title></Card></Col>
                <Col xs={12} md={6}><Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}><Text type="secondary" style={{ fontSize: 11 }}>Paid</Text><Title level={4} style={{ margin: 0, color: '#52c41a' }}>{paidCount}</Title></Card></Col>
                <Col xs={12} md={6}><Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}><Text type="secondary" style={{ fontSize: 11 }}>Pending Approval</Text><Title level={4} style={{ margin: 0, color: '#1890ff' }}>{pendingCount}</Title></Card></Col>
                <Col xs={12} md={6}><Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}><Text type="secondary" style={{ fontSize: 11 }}>Draft</Text><Title level={4} style={{ margin: 0 }}>{draftCount}</Title></Card></Col>
            </Row>

            <Table dataSource={payrolls} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} />

            {/* Generate Payroll Modal */}
            <Modal
                title={`Generate Payroll — ${dayjs(month).format('MMMM YYYY')}`}
                open={generateOpen}
                onCancel={() => setGenerateOpen(false)}
                width={640}
                onOk={handleGenerate}
                confirmLoading={generateLoading}
                okText={`Generate ${selectedEmployees.length} Payslip(s)`}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Employees</Text>
                    {availableEmployees.length === 0 ? (
                        <Text type="secondary">All employees already have payroll for this month</Text>
                    ) : (
                        <Select
                            mode="multiple" style={{ width: '100%' }}
                            placeholder="Select employees"
                            value={selectedEmployees}
                            onChange={setSelectedEmployees}
                            options={availableEmployees.map(e => ({ label: `${e.fullName} (${e.employeeNumber})`, value: e._id }))}
                        />
                    )}
                </div>
                {selectedEmployees.map(empId => {
                    const emp = employees.find(e => e._id === empId);
                    const vpData = variablePayMap[empId] || { variablePay: 0, variableReason: '', otherDeductions: 0, deductionReason: '' };
                    return (
                        <Card key={empId} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                            <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                                <Text strong>{emp?.fullName}</Text>
                                <Text type="secondary">Base: {formatCurrency(emp?.salaryStructure?.totalFixedCTC || 0)}</Text>
                            </Flex>
                            <Flex gap={8}>
                                <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Variable Pay (₹)</Text>
                                    <InputNumber size="small" style={{ width: '100%' }} min={0} value={vpData.variablePay}
                                        onChange={(v) => setVariablePayMap({ ...variablePayMap, [empId]: { ...vpData, variablePay: v || 0 } })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Deductions (₹)</Text>
                                    <InputNumber size="small" style={{ width: '100%' }} min={0} value={vpData.otherDeductions}
                                        onChange={(v) => setVariablePayMap({ ...variablePayMap, [empId]: { ...vpData, otherDeductions: v || 0 } })} />
                                </div>
                            </Flex>
                        </Card>
                    );
                })}
            </Modal>

            {/* Mark Paid Modal */}
            <Modal
                title="Mark as Paid"
                open={markPaidModal.open}
                onCancel={() => setMarkPaidModal({ open: false, payroll: null })}
                onOk={handleMarkPaid}
                confirmLoading={actionLoading}
            >
                {markPaidModal.payroll && (
                    <div>
                        <Text>Net Amount: <Text strong style={{ color: '#52c41a', fontSize: 18 }}>{formatCurrency(markPaidModal.payroll.netSalary)}</Text></Text>
                        <div style={{ marginTop: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Transaction ID *</Text>
                            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction reference" />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payslip Drawer */}
            <Drawer
                title="Salary Slip"
                open={payslipOpen}
                onClose={() => setPayslipOpen(false)}
                width={520}
                extra={<Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>}
            >
                {selectedPayroll && (
                    <div id="payslip-content">
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <Title level={3} style={{ color: '#6C63FF', margin: 0 }}>AgencyOS</Title>
                            <Title level={5} style={{ margin: '4px 0' }}>Salary Slip — {selectedPayroll.monthName}</Title>
                        </div>
                        <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Name">{typeof selectedPayroll.employeeId === 'object' ? selectedPayroll.employeeId?.fullName : '—'}</Descriptions.Item>
                            <Descriptions.Item label="EMP#">{typeof selectedPayroll.employeeId === 'object' ? selectedPayroll.employeeId?.employeeNumber : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Department">{typeof selectedPayroll.employeeId === 'object' ? selectedPayroll.employeeId?.department : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Designation">{typeof selectedPayroll.employeeId === 'object' ? selectedPayroll.employeeId?.designation : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Pay Period">{selectedPayroll.monthName}</Descriptions.Item>
                            <Descriptions.Item label="Payment Mode">{selectedPayroll.paymentMode || 'Bank Transfer'}</Descriptions.Item>
                        </Descriptions>

                        <Title level={5}>Earnings</Title>
                        <Table
                            dataSource={[
                                { key: 'basic', item: 'Basic Salary', amount: selectedPayroll.basicSalary },
                                { key: 'hra', item: 'HRA', amount: selectedPayroll.hra },
                                { key: 'allowances', item: 'Allowances', amount: selectedPayroll.allowances },
                                { key: 'overtime', item: 'Overtime Pay', amount: selectedPayroll.overtimePay },
                                { key: 'variable', item: 'Variable Pay', amount: selectedPayroll.variablePay },
                            ]}
                            columns={[
                                { title: 'Item', dataIndex: 'item', key: 'item' },
                                { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (v: number) => formatCurrency(v) },
                            ]}
                            pagination={false} size="small" showHeader={false}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0}><Text strong>Total Earnings</Text></Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right"><Text strong>{formatCurrency(selectedPayroll.grossSalary)}</Text></Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />

                        <Title level={5} style={{ marginTop: 16 }}>Deductions</Title>
                        <Table
                            dataSource={[
                                { key: 'absent', item: 'Absent Deduction', amount: selectedPayroll.absentDeduction },
                                { key: 'leave', item: 'Leave Deduction', amount: selectedPayroll.leaveDeduction },
                                { key: 'other', item: 'Other Deductions', amount: selectedPayroll.otherDeductions },
                            ]}
                            columns={[
                                { title: 'Item', dataIndex: 'item', key: 'item' },
                                { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (v: number) => <Text type="danger">{formatCurrency(v)}</Text> },
                            ]}
                            pagination={false} size="small" showHeader={false}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0}><Text strong>Total Deductions</Text></Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right"><Text strong type="danger">{formatCurrency(selectedPayroll.totalDeductions)}</Text></Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />

                        <Card style={{ borderRadius: 12, marginTop: 16, textAlign: 'center', backgroundColor: '#f6ffed' }}>
                            <Text type="secondary">Net Salary</Text>
                            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>{formatCurrency(selectedPayroll.netSalary)}</Title>
                        </Card>

                        <Descriptions size="small" column={4} style={{ marginTop: 16 }}>
                            <Descriptions.Item label="Present">{selectedPayroll.presentDays}</Descriptions.Item>
                            <Descriptions.Item label="Absent">{selectedPayroll.absentDays}</Descriptions.Item>
                            <Descriptions.Item label="Leave">{selectedPayroll.leaveDays}</Descriptions.Item>
                            <Descriptions.Item label="OT Hours">{selectedPayroll.overtimeHours}</Descriptions.Item>
                        </Descriptions>

                        <Divider />
                        <Text type="secondary" style={{ fontSize: 11 }}>Generated by AgencyOS • {dayjs(selectedPayroll.createdAt).format('DD MMM YYYY')}</Text>
                        {selectedPayroll.status === 'paid' && (
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                Paid on {dayjs(selectedPayroll.paidAt).format('DD MMM YYYY')} • Txn: {selectedPayroll.transactionId}
                            </Text>
                        )}
                    </div>
                )}
            </Drawer>

            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #payslip-content, #payslip-content * { visibility: visible; }
                    #payslip-content { position: absolute; top: 0; left: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}
