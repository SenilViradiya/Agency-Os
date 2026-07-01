'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Space, Flex, Spin, Card, Row, Col, Tag, Avatar, Table, Tabs, Descriptions, Badge, App, Rate, Progress, Timeline, Empty, Tooltip, Modal, InputNumber, Input,
} from 'antd';
import {
    ArrowLeftOutlined, EditOutlined, PhoneOutlined, MailOutlined, WhatsAppOutlined,
    CalendarOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined,
    ClockCircleOutlined, DollarOutlined, TrophyOutlined, LockOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeDrawer from '@/components/hr/employees/EmployeeDrawer';
import AttendanceCalendar from '@/components/hr/attendance/AttendanceCalendar';
import MarkAttendanceModal from '@/components/hr/attendance/MarkAttendanceModal';
import ResetPasswordModal from '@/components/shared/ResetPasswordModal';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { useRouter, useParams } from 'next/navigation';
import dayjs from 'dayjs';


const { Title, Text, Paragraph } = Typography;

const statusColors: Record<string, string> = { active: 'green', on_leave: 'blue', resigned: 'orange', terminated: 'red' };
const typeLabels: Record<string, string> = { full_time: 'Full Time', part_time: 'Part Time', freelancer: 'Freelancer', intern: 'Intern' };
const typeColors: Record<string, string> = { full_time: 'blue', part_time: 'cyan', freelancer: 'purple', intern: 'green' };
const leaveTypeColors: Record<string, string> = { annual: 'blue', sick: 'red', casual: 'green', unpaid: 'orange', other: 'default' };

export default function EmployeeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { message } = App.useApp();
    const { data: session } = useSession();
    const employeeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<any>(null);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<any>({});
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
    const [allLeaves, setAllLeaves] = useState<any[]>([]);
    const [allPayrolls, setAllPayrolls] = useState<any[]>([]);
    const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('profile');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
    const [resetModalOpen, setResetModalOpen] = useState(false);

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');
    const currentUserRole = (session?.user as any)?.role;
    const isSelf = employee?.userId && (((employee.userId as any)._id || (employee.userId as any)) === session?.user?.id);
    const targetIsSuperAdmin = (employee?.userId as any)?.role?.name === 'Super Admin' || (employee?.userId as any)?.role === 'Super Admin';
    const isResetDisabled = isSelf || (currentUserRole === 'Manager' && targetIsSuperAdmin);

    const fetchEmployee = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/hr/employees/${employeeId}`);
            if (res.data.success) {
                setEmployee(res.data.data.employee);
                setPayrolls(res.data.data.payrolls || []);
                setAttendanceSummary(res.data.data.attendanceSummary || {});
                setAttendanceRecords(res.data.data.attendanceRecords || []);
                setPendingLeaves(res.data.data.pendingLeaves || []);
            }
        } catch (error) {
            message.error('Failed to load employee');
        } finally {
            setLoading(false);
        }
    }, [employeeId, message]);

    const fetchLeaves = useCallback(async () => {
        try {
            const res = await apiClient.get(`/hr/leaves?employeeId=${employeeId}&limit=50`);
            if (res.data.success) setAllLeaves(res.data.data);
        } catch { /* ignore */ }
    }, [employeeId]);

    const fetchAllPayrolls = useCallback(async () => {
        try {
            const res = await apiClient.get(`/hr/payroll?employeeId=${employeeId}&limit=6`);
            if (res.data.success) setAllPayrolls(res.data.data);
        } catch { /* ignore */ }
    }, [employeeId]);

    const fetchPerformance = useCallback(async () => {
        try {
            const res = await apiClient.get(`/hr/performance?employeeId=${employeeId}&limit=12`);
            if (res.data.success) setPerformanceReviews(res.data.data);
        } catch { /* ignore */ }
    }, [employeeId]);

    const fetchAttendance = useCallback(async () => {
        try {
            const res = await apiClient.get(`/hr/attendance?employeeId=${employeeId}&month=${selectedMonth}&limit=50`);
            if (res.data.success) {
                setAttendanceRecords(res.data.data);
                if (res.data.summary) setAttendanceSummary(res.data.summary);
            }
        } catch { /* ignore */ }
    }, [employeeId, selectedMonth]);

    useEffect(() => { fetchEmployee(); }, [fetchEmployee]);
    useEffect(() => { fetchLeaves(); fetchAllPayrolls(); fetchPerformance(); }, [fetchLeaves, fetchAllPayrolls, fetchPerformance]);
    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    const handleSave = async (values: any) => {
        try {
            const res = await apiClient.put(`/hr/employees/${employeeId}`, values);
            if (res.data.success) { message.success('Employee updated'); setDrawerOpen(false); fetchEmployee(); }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to update');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
    if (!employee) return <Empty description="Employee not found" />;

    const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

    const leaveStatusColors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
    const payrollStatusColors: Record<string, string> = { draft: 'default', approved: 'blue', paid: 'green' };

    return (
        <div>
            <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/hr/employees')} />
                <Title level={3} style={{ margin: 0 }}>Employee Profile</Title>
            </Flex>

            {/* Header Card */}
            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={16}>
                    <Flex align="center" gap={16}>
                        <Avatar src={employee.avatar} size={72} style={{ backgroundColor: '#6C63FF', fontSize: 28 }}>
                            {employee.fullName?.charAt(0)}
                        </Avatar>
                        <div>
                            <Flex align="center" gap={8}>
                                <Title level={3} style={{ margin: 0 }}>{employee.fullName}</Title>
                                <Badge status={employee.status === 'active' ? 'success' : 'error'} text={employee.status?.replace('_', ' ')} />
                            </Flex>
                            <Text type="secondary" style={{ fontSize: 13 }}>{employee.employeeNumber}</Text>
                            <Flex gap={6} style={{ marginTop: 4 }}>
                                <Text>{employee.designation}</Text>
                                <Tag>{employee.department}</Tag>
                                <Tag color={typeColors[employee.employmentType]}>{typeLabels[employee.employmentType]}</Tag>
                            </Flex>
                            <Flex gap={16} style={{ marginTop: 8 }}>
                                <Text type="secondary"><CalendarOutlined /> Joined {dayjs(employee.joiningDate).format('DD MMM YYYY')}</Text>
                                {employee.reportingManager && <Text type="secondary"><UserOutlined /> Reports to {(employee.reportingManager as any)?.fullName}</Text>}
                                <Text type="secondary"><PhoneOutlined /> {employee.phone}</Text>
                                <Text type="secondary"><MailOutlined /> {employee.email}</Text>
                            </Flex>
                        </div>
                    </Flex>
                    {isManager && (
                        <Space>
                            <Button 
                                icon={<LockOutlined />} 
                                danger
                                disabled={isResetDisabled}
                                onClick={() => setResetModalOpen(true)}
                            >
                                Reset Password
                            </Button>
                            <Button icon={<EditOutlined />} type="primary" onClick={() => { setDrawerOpen(true); }}>
                                Edit Profile
                            </Button>
                        </Space>
                    )}
                </Flex>
            </Card>

            {/* Detail Tabs */}
            <Card style={{ borderRadius: 12 }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'profile',
                            label: 'Profile',
                            children: (
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} md={12}>
                                        <Descriptions title="Personal Information" bordered column={1} size="small">
                                            <Descriptions.Item label="Full Name">{employee.fullName}</Descriptions.Item>
                                            <Descriptions.Item label="Email">{employee.email}</Descriptions.Item>
                                            <Descriptions.Item label="Phone">{employee.phone}</Descriptions.Item>
                                            <Descriptions.Item label="WhatsApp">{employee.whatsappNumber || '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Date of Birth">{employee.dateOfBirth ? dayjs(employee.dateOfBirth).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Gender">{employee.gender || '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Blood Group">{employee.bloodGroup || '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Personal Email">{employee.personalEmail || '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Emergency Contact">
                                                {employee.emergencyContact?.name ? `${employee.emergencyContact.name} (${employee.emergencyContact.relation}) — ${employee.emergencyContact.phone}` : '—'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Address">
                                                {employee.address?.street ? `${employee.address.street}, ${employee.address.city}, ${employee.address.state} — ${employee.address.pincode}` : '—'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Descriptions title="Job Information" bordered column={1} size="small">
                                            <Descriptions.Item label="Department">{employee.department}</Descriptions.Item>
                                            <Descriptions.Item label="Designation">{employee.designation}</Descriptions.Item>
                                            <Descriptions.Item label="Employment Type">{typeLabels[employee.employmentType]}</Descriptions.Item>
                                            <Descriptions.Item label="Joining Date">{dayjs(employee.joiningDate).format('DD MMM YYYY')}</Descriptions.Item>
                                            <Descriptions.Item label="Probation End">{employee.probationEndDate ? dayjs(employee.probationEndDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                                            <Descriptions.Item label="Skills">
                                                {employee.skills?.length ? employee.skills.map((s: string) => <Tag key={s}>{s}</Tag>) : '—'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Basic Salary">{formatCurrency(employee.salaryStructure?.basicSalary)}</Descriptions.Item>
                                            <Descriptions.Item label="HRA">{formatCurrency(employee.salaryStructure?.hra)}</Descriptions.Item>
                                            <Descriptions.Item label="Allowances">{formatCurrency(employee.salaryStructure?.allowances)}</Descriptions.Item>
                                            <Descriptions.Item label="Total CTC">{formatCurrency(employee.salaryStructure?.totalFixedCTC)}</Descriptions.Item>
                                        </Descriptions>
                                        {employee.equipmentAssigned?.length > 0 && (
                                            <div style={{ marginTop: 16 }}>
                                                <Title level={5}>Equipment Assigned</Title>
                                                <Table
                                                    dataSource={employee.equipmentAssigned}
                                                    columns={[
                                                        { title: 'Name', dataIndex: 'name', key: 'name' },
                                                        { title: 'Serial', dataIndex: 'serialNumber', key: 'serialNumber' },
                                                        { title: 'Assigned', dataIndex: 'assignedDate', key: 'assignedDate', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '—' },
                                                    ]}
                                                    rowKey="serialNumber"
                                                    pagination={false}
                                                    size="small"
                                                />
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            ),
                        },
                        {
                            key: 'attendance',
                            label: 'Attendance',
                            children: (
                                <div>
                                    <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                                        <Input
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            style={{ width: 200 }}
                                        />
                                        {isManager && (
                                            <Button type="primary" onClick={() => setMarkAttendanceOpen(true)}>
                                                Mark Attendance
                                            </Button>
                                        )}
                                    </Flex>
                                    <AttendanceCalendar records={attendanceRecords} month={selectedMonth} />
                                    <Descriptions title="Monthly Summary" bordered column={3} size="small" style={{ marginTop: 16 }}>
                                        <Descriptions.Item label="Present">{attendanceSummary.presentDays || 0}</Descriptions.Item>
                                        <Descriptions.Item label="Absent">{attendanceSummary.absentDays || 0}</Descriptions.Item>
                                        <Descriptions.Item label="Leave">{attendanceSummary.leaveDays || 0}</Descriptions.Item>
                                        <Descriptions.Item label="Half Days">{attendanceSummary.halfDays || 0}</Descriptions.Item>
                                        <Descriptions.Item label="Total Hours">{Math.round((attendanceSummary.totalHours || 0) * 10) / 10}h</Descriptions.Item>
                                        <Descriptions.Item label="Overtime">{Math.round((attendanceSummary.overtimeHours || 0) * 10) / 10}h</Descriptions.Item>
                                    </Descriptions>
                                </div>
                            ),
                        },
                        {
                            key: 'leaves',
                            label: 'Leaves',
                            children: (
                                <div>
                                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                        {(['annual', 'sick', 'casual', 'unpaid'] as const).map((type) => {
                                            const total = type === 'unpaid' ? (employee.leaveBalance?.unpaid || 0) : ({ annual: 12, sick: 6, casual: 6 }[type] || 0);
                                            const remaining = employee.leaveBalance?.[type] ?? total;
                                            const used = type === 'unpaid' ? remaining : total - remaining;
                                            return (
                                                <Col xs={12} md={6} key={type}>
                                                    <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                                                        <Text strong style={{ textTransform: 'capitalize' }}>{type} Leave</Text>
                                                        <div style={{ margin: '8px 0' }}>
                                                            <Progress
                                                                type="circle"
                                                                percent={type === 'unpaid' ? 0 : Math.round((used / total) * 100)}
                                                                size={60}
                                                                format={() => type === 'unpaid' ? `${remaining}` : `${remaining}/${total}`}
                                                            />
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {type === 'unpaid' ? `${remaining} taken` : `${used} used · ${remaining} left`}
                                                        </Text>
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                    <Table
                                        dataSource={allLeaves}
                                        rowKey="_id"
                                        pagination={{ pageSize: 5 }}
                                        size="small"
                                        columns={[
                                            { title: 'LVE#', dataIndex: 'leaveNumber', key: 'leaveNumber', render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
                                            { title: 'Type', dataIndex: 'leaveType', key: 'leaveType', render: (t: string) => <Tag color={leaveTypeColors[t]}>{t}</Tag> },
                                            { title: 'From', dataIndex: 'startDate', key: 'startDate', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
                                            { title: 'To', dataIndex: 'endDate', key: 'endDate', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
                                            { title: 'Days', dataIndex: 'totalDays', key: 'totalDays' },
                                            { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={leaveStatusColors[s]}>{s}</Tag> },
                                            { title: 'Applied', dataIndex: 'appliedAt', key: 'appliedAt', render: (d: string) => dayjs(d).format('DD MMM YYYY') },
                                        ]}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'payroll',
                            label: 'Payroll',
                            children: (
                                <div>
                                    <Table
                                        dataSource={allPayrolls}
                                        rowKey="_id"
                                        pagination={false}
                                        size="small"
                                        columns={[
                                            { title: 'Month', dataIndex: 'monthName', key: 'monthName' },
                                            { title: 'Working', dataIndex: 'workingDays', key: 'workingDays' },
                                            { title: 'Present', dataIndex: 'presentDays', key: 'presentDays' },
                                            { title: 'Absent', dataIndex: 'absentDays', key: 'absentDays' },
                                            { title: 'Gross', dataIndex: 'grossSalary', key: 'grossSalary', render: (v: number) => formatCurrency(v) },
                                            { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => <Text type="danger">{formatCurrency(v)}</Text> },
                                            { title: 'Net', dataIndex: 'netSalary', key: 'netSalary', render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text> },
                                            { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={payrollStatusColors[s]}>{s}</Tag> },
                                        ]}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'performance',
                            label: 'Performance',
                            children: (
                                <div>
                                    {performanceReviews.length === 0 ? (
                                        <Empty description="No performance reviews yet" />
                                    ) : (
                                        <Timeline
                                            items={performanceReviews.map((review: any) => ({
                                                color: review.status === 'published' ? 'green' : 'gray',
                                                children: (
                                                    <Card size="small" style={{ borderRadius: 10 }}>
                                                        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                                                            <Space>
                                                                <Text strong>{review.monthName}</Text>
                                                                <Tag color={review.status === 'published' ? 'green' : 'default'}>{review.status}</Tag>
                                                            </Space>
                                                            <Rate disabled value={review.ratings?.overallRating || 0} allowHalf />
                                                        </Flex>
                                                        {review.status === 'published' && (
                                                            <div>
                                                                <Row gutter={[16, 8]}>
                                                                    <Col span={12}><Text type="secondary">Work Quality:</Text> <Rate disabled value={review.ratings?.workQuality} count={5} style={{ fontSize: 12 }} /></Col>
                                                                    <Col span={12}><Text type="secondary">Punctuality:</Text> <Rate disabled value={review.ratings?.punctuality} count={5} style={{ fontSize: 12 }} /></Col>
                                                                    <Col span={12}><Text type="secondary">Teamwork:</Text> <Rate disabled value={review.ratings?.teamwork} count={5} style={{ fontSize: 12 }} /></Col>
                                                                    <Col span={12}><Text type="secondary">Communication:</Text> <Rate disabled value={review.ratings?.communication} count={5} style={{ fontSize: 12 }} /></Col>
                                                                </Row>
                                                                {review.strengths && <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}><Text strong>Strengths:</Text> {review.strengths}</Paragraph>}
                                                                {review.improvements && <Paragraph type="secondary" style={{ fontSize: 12 }}><Text strong>Improvements:</Text> {review.improvements}</Paragraph>}
                                                            </div>
                                                        )}
                                                    </Card>
                                                ),
                                            }))}
                                        />
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />
            </Card>

            <EmployeeDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleSave}
                initialData={employee}
            />

            <MarkAttendanceModal
                open={markAttendanceOpen}
                onClose={() => setMarkAttendanceOpen(false)}
                employeeId={employeeId}
                employeeName={employee.fullName}
                onSuccess={() => { fetchAttendance(); fetchEmployee(); }}
            />

            {employee?.userId && (
                <ResetPasswordModal
                    open={resetModalOpen}
                    onClose={() => setResetModalOpen(false)}
                    userId={(employee.userId as any)._id || (employee.userId as any)}
                    userName={employee.fullName}
                    apiEndpoint="/api/users/[id]/reset-password"
                    context="team"
                />
            )}
        </div>
    );
}
