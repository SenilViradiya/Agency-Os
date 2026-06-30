'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Space, Flex, Select, Table, Tag, Avatar, App, Spin, Tabs, Badge, Modal, Input, Drawer, DatePicker, Switch, Radio, Card, Progress,
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const leaveTypeColors: Record<string, string> = { annual: 'blue', sick: 'red', casual: 'green', unpaid: 'orange', other: 'default' };
const leaveStatusColors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };

export default function LeavesPage() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [tab, setTab] = useState('all');
    const [employees, setEmployees] = useState<any[]>([]);
    const [filters, setFilters] = useState({ employeeId: undefined as string | undefined, leaveType: undefined as string | undefined });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [approvalModal, setApprovalModal] = useState<{ open: boolean; leave: any }>({ open: false, leave: null });
    const [reviewNotes, setReviewNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // For leave request form
    const [leaveFormEmployee, setLeaveFormEmployee] = useState<string | undefined>(undefined);
    const [leaveType, setLeaveType] = useState<string>('annual');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');
    const [reason, setReason] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [employeeBalance, setEmployeeBalance] = useState<any>(null);

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');

    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/hr/leaves?limit=50';
            if (tab !== 'all') url += `&status=${tab}`;
            if (filters.employeeId) url += `&employeeId=${filters.employeeId}`;
            if (filters.leaveType) url += `&leaveType=${filters.leaveType}`;
            const res = await apiClient.get(url);
            if (res.data.success) {
                setLeaves(res.data.data);
            }
        } catch { message.error('Failed to load leaves'); } finally { setLoading(false); }
    }, [tab, filters, message]);

    const fetchPendingCount = useCallback(async () => {
        try {
            const res = await apiClient.get('/hr/leaves?status=pending&limit=1');
            setPendingCount(res.data?.meta?.total || 0);
        } catch { /* ignore */ }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await apiClient.get('/hr/employees?limit=100&status=active');
            if (res.data.success) setEmployees(res.data.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchEmployees(); fetchPendingCount(); }, [fetchEmployees, fetchPendingCount]);
    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!approvalModal.leave) return;
        if (action === 'reject' && !reviewNotes.trim()) {
            message.warning('Review notes are required for rejection');
            return;
        }
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/hr/leaves/${approvalModal.leave._id}/action`, { action, reviewNotes });
            if (res.data.success) {
                message.success(`Leave ${action}d successfully`);
                setApprovalModal({ open: false, leave: null });
                setReviewNotes('');
                fetchLeaves();
                fetchPendingCount();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || `Failed to ${action} leave`);
        } finally { setActionLoading(false); }
    };

    const handleApplyLeave = async () => {
        if (!dateRange || !reason.trim()) {
            message.warning('Please fill all required fields');
            return;
        }
        setSubmitLoading(true);
        try {
            const res = await apiClient.post('/hr/leaves', {
                leaveType,
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
                reason,
                isHalfDay,
                halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
                employeeId: isManager ? leaveFormEmployee : undefined,
            });
            if (res.data.success) {
                message.success('Leave request submitted');
                setDrawerOpen(false);
                resetForm();
                fetchLeaves();
                fetchPendingCount();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to apply leave');
        } finally { setSubmitLoading(false); }
    };

    const resetForm = () => {
        setLeaveType('annual');
        setDateRange(null);
        setIsHalfDay(false);
        setHalfDayPeriod('morning');
        setReason('');
        setLeaveFormEmployee(undefined);
        setEmployeeBalance(null);
    };

    const fetchBalance = async (empId: string) => {
        try {
            const res = await apiClient.get(`/hr/employees/${empId}`);
            if (res.data.success) setEmployeeBalance(res.data.data.employee?.leaveBalance);
        } catch { /* ignore */ }
    };

    const columns = [
        {
            title: 'LVE#', dataIndex: 'leaveNumber', key: 'leaveNumber', width: 100,
            render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
        },
        {
            title: 'Employee', key: 'employee',
            render: (_: any, rec: any) => {
                const emp = rec.employeeId;
                return (
                    <Flex align="center" gap={8}>
                        <Avatar src={emp?.avatar} size={32} style={{ backgroundColor: '#6C63FF' }}>{emp?.fullName?.charAt(0)}</Avatar>
                        <div>
                            <Text strong style={{ fontSize: 13 }}>{emp?.fullName}</Text>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{emp?.department}</Text>
                        </div>
                    </Flex>
                );
            },
        },
        {
            title: 'Type', dataIndex: 'leaveType', key: 'leaveType',
            render: (t: string) => <Tag color={leaveTypeColors[t]}>{t}</Tag>,
        },
        { title: 'From', dataIndex: 'startDate', key: 'startDate', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
        { title: 'To', dataIndex: 'endDate', key: 'endDate', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Days', dataIndex: 'totalDays', key: 'totalDays', width: 60 },
        {
            title: 'Reason', dataIndex: 'reason', key: 'reason', width: 200,
            render: (r: string) => <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0, fontSize: 12 }}>{r}</Paragraph>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (s: string) => <Tag color={leaveStatusColors[s]}>{s}</Tag>,
        },
        { title: 'Applied', dataIndex: 'appliedAt', key: 'appliedAt', render: (d: string) => dayjs(d).format('DD MMM'), width: 80 },
        {
            title: 'Actions', key: 'actions', width: 100,
            render: (_: any, rec: any) => {
                if (rec.status === 'pending' && isManager) {
                    return (
                        <Space>
                            <Button size="small" type="primary" icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                onClick={() => { setApprovalModal({ open: true, leave: rec }); setReviewNotes(''); }} />
                            <Button size="small" danger icon={<CloseOutlined />}
                                onClick={() => { setApprovalModal({ open: true, leave: rec }); setReviewNotes(''); }} />
                        </Space>
                    );
                }
                if (rec.status === 'pending' && rec.userId === (session?.user as any)?.id) {
                    return <Button size="small" danger>Cancel</Button>;
                }
                return null;
            },
        },
    ];

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <PageHeader title="Leave Management" />
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { resetForm(); setDrawerOpen(true); }}>
                    Apply Leave
                </Button>
            </Flex>

            <Tabs
                activeKey={tab}
                onChange={setTab}
                items={[
                    { key: 'all', label: 'All Requests' },
                    { key: 'pending', label: <Badge count={pendingCount} offset={[10, 0]} size="small" color="#ff4d4f">Pending</Badge> },
                    { key: 'approved', label: 'Approved' },
                    { key: 'rejected', label: 'Rejected' },
                ]}
                style={{ marginBottom: 16 }}
            />

            <Card style={{ marginBottom: 16, borderRadius: 12 }}>
                <Flex gap={16} align="center" wrap="wrap">
                    {isManager && (
                        <Select
                            placeholder="Employee" style={{ width: 200 }} allowClear
                            showSearch filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                            onChange={(v) => setFilters({ ...filters, employeeId: v })}
                            options={employees.map(e => ({ label: e.fullName, value: e._id }))}
                        />
                    )}
                    <Select
                        placeholder="Leave Type" style={{ width: 140 }} allowClear
                        onChange={(v) => setFilters({ ...filters, leaveType: v })}
                        options={[
                            { label: 'Annual', value: 'annual' },
                            { label: 'Sick', value: 'sick' },
                            { label: 'Casual', value: 'casual' },
                            { label: 'Unpaid', value: 'unpaid' },
                        ]}
                    />
                </Flex>
            </Card>

            <Table
                dataSource={leaves}
                columns={columns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
            />

            {/* Leave Approval Modal */}
            <Modal
                title="Leave Request Review"
                open={approvalModal.open}
                onCancel={() => setApprovalModal({ open: false, leave: null })}
                width={480}
                footer={
                    <Flex gap={8} justify="end">
                        <Button danger loading={actionLoading} onClick={() => handleAction('reject')}>Reject</Button>
                        <Button type="primary" loading={actionLoading} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleAction('approve')}>Approve</Button>
                    </Flex>
                }
            >
                {approvalModal.leave && (
                    <div>
                        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
                            <Avatar src={approvalModal.leave.employeeId?.avatar} style={{ backgroundColor: '#6C63FF' }}>
                                {approvalModal.leave.employeeId?.fullName?.charAt(0)}
                            </Avatar>
                            <Text strong>{approvalModal.leave.employeeId?.fullName}</Text>
                        </Flex>
                        <Space orientation="vertical" style={{ width: '100%', marginBottom: 16 }}>
                            <Text>Type: <Tag color={leaveTypeColors[approvalModal.leave.leaveType]}>{approvalModal.leave.leaveType}</Tag></Text>
                            <Text>Dates: {dayjs(approvalModal.leave.startDate).format('DD MMM YYYY')} — {dayjs(approvalModal.leave.endDate).format('DD MMM YYYY')}</Text>
                            <Text>Total Days: <Text strong>{approvalModal.leave.totalDays}</Text></Text>
                            <Text>Reason: {approvalModal.leave.reason}</Text>
                        </Space>
                        <Input.TextArea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Review notes (required for rejection)"
                            rows={3}
                        />
                    </div>
                )}
            </Modal>

            {/* Apply Leave Drawer */}
            <Drawer
                title="Apply Leave"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={480}
                footer={
                    <Flex justify="end">
                        <Button type="primary" loading={submitLoading} onClick={handleApplyLeave}>Submit Leave Request</Button>
                    </Flex>
                }
            >
                {isManager && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Employee</Text>
                        <Select
                            showSearch style={{ width: '100%' }}
                            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                            placeholder="Select employee (leave blank for self)"
                            allowClear
                            value={leaveFormEmployee}
                            onChange={(v) => { setLeaveFormEmployee(v); if (v) fetchBalance(v); }}
                            options={employees.map(e => ({ label: e.fullName, value: e._id }))}
                        />
                    </div>
                )}
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Leave Type</Text>
                    <Select value={leaveType} onChange={setLeaveType} style={{ width: '100%' }} options={[
                        { label: 'Annual', value: 'annual' },
                        { label: 'Sick', value: 'sick' },
                        { label: 'Casual', value: 'casual' },
                        { label: 'Unpaid', value: 'unpaid' },
                    ]} />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Date Range</Text>
                    <RangePicker style={{ width: '100%' }} value={dateRange} onChange={(v) => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])} />
                </div>
                <Flex gap={16} align="center" style={{ marginBottom: 16 }}>
                    <Text strong>Half Day</Text>
                    <Switch checked={isHalfDay} onChange={setIsHalfDay} />
                    {isHalfDay && (
                        <Radio.Group value={halfDayPeriod} onChange={(e) => setHalfDayPeriod(e.target.value)}>
                            <Radio value="morning">Morning</Radio>
                            <Radio value="afternoon">Afternoon</Radio>
                        </Radio.Group>
                    )}
                </Flex>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>Reason *</Text>
                    <Input.TextArea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for leave..." />
                </div>
                {employeeBalance && (
                    <Card size="small" style={{ borderRadius: 10, backgroundColor: '#f6ffed' }}>
                        <Text strong>Available Balance</Text>
                        <Flex gap={16} style={{ marginTop: 8 }}>
                            <div><Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Annual</Text><Text strong>{employeeBalance.annual}</Text></div>
                            <div><Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Sick</Text><Text strong>{employeeBalance.sick}</Text></div>
                            <div><Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Casual</Text><Text strong>{employeeBalance.casual}</Text></div>
                            <div><Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Unpaid</Text><Text strong>{employeeBalance.unpaid}</Text></div>
                        </Flex>
                    </Card>
                )}
            </Drawer>
        </div>
    );
}
