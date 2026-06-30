'use client';

import { useState, useEffect } from 'react';
import {
    Row, Col, Card, Typography, Flex, Space, Tag, Avatar, Spin, Badge, Button, Table, Empty, Tooltip, App, Progress,
} from 'antd';
import {
    TeamOutlined, CheckCircleOutlined, CalendarOutlined, FileProtectOutlined,
    DollarOutlined, NotificationOutlined, ClockCircleOutlined, UserOutlined,
    CheckOutlined, CloseOutlined, EyeOutlined, ReadOutlined, PushpinFilled,
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'next/navigation';

dayjs.extend(relativeTime);
const { Title, Text, Link: TypoLink, Paragraph } = Typography;

const StatCard = ({ title, value, icon, color, badge }: { title: string; value: number | string; icon: React.ReactNode; color: string; badge?: boolean }) => (
    <Card
        styles={{ body: { padding: '20px' } }}
        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
    >
        <Flex align="center" gap={12}>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                fontSize: '20px'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <Text type="secondary" style={{ fontWeight: 500, fontSize: 12, display: 'block' }}>
                    {title}
                </Text>
                <Flex align="center" gap={8}>
                    <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                        {value}
                    </Title>
                    {badge && Number(value) > 0 && (
                        <Badge count={value} color="#ff4d4f" size="small" />
                    )}
                </Flex>
            </div>
        </Flex>
    </Card>
);

const leaveTypeColors: Record<string, string> = {
    annual: 'blue',
    sick: 'red',
    casual: 'green',
    unpaid: 'orange',
    other: 'default',
};

const announcementTypeColors: Record<string, string> = {
    general: 'blue',
    policy: 'purple',
    holiday: 'green',
    event: 'magenta',
    urgent: 'red',
};

export default function HROverviewPage() {
    const router = useRouter();
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        onLeaveToday: 0,
        pendingLeaves: 0,
        payrollDue: 0,
        unreadAnnouncements: 0,
    });
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    const isManager = session?.user && (
        (session.user as any).role === 'Super Admin' ||
        (session.user as any).role === 'Manager'
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = dayjs().format('YYYY-MM-DD');
            const currentMonth = dayjs().format('YYYY-MM');

            const [empRes, attRes, leavesRes, annRes] = await Promise.all([
                apiClient.get('/hr/employees?limit=100&status=active'),
                apiClient.get(`/hr/attendance?month=${currentMonth}&limit=200`),
                apiClient.get('/hr/leaves?status=pending&limit=10'),
                apiClient.get('/hr/announcements'),
            ]);

            // Employees
            const employees = empRes.data?.data || [];
            const totalEmployees = empRes.data?.meta?.total || employees.length;

            // Attendance today
            const allAttendance = attRes.data?.data || [];
            const todayRecords = allAttendance.filter((r: any) =>
                dayjs(r.date).format('YYYY-MM-DD') === today
            );
            const presentToday = todayRecords.filter((r: any) =>
                ['present', 'work_from_home'].includes(r.status)
            ).length;
            const onLeaveToday = todayRecords.filter((r: any) =>
                r.status === 'on_leave'
            ).length;

            // Build per-employee monthly summaries
            const empMap = new Map<string, any>();
            for (const emp of employees) {
                empMap.set(emp._id, {
                    _id: emp._id,
                    fullName: emp.fullName,
                    avatar: emp.avatar,
                    department: emp.department,
                    present: 0,
                    absent: 0,
                    leave: 0,
                    halfDay: 0,
                    totalHours: 0,
                });
            }
            for (const rec of allAttendance) {
                const empId = typeof rec.employeeId === 'object' ? rec.employeeId?._id : rec.employeeId;
                const entry = empMap.get(empId);
                if (entry) {
                    if (['present', 'work_from_home'].includes(rec.status)) entry.present++;
                    else if (rec.status === 'absent') entry.absent++;
                    else if (rec.status === 'on_leave') entry.leave++;
                    else if (rec.status === 'half_day') entry.halfDay++;
                    entry.totalHours += rec.totalHours || 0;
                }
            }
            setAttendanceData(Array.from(empMap.values()));

            // Leaves
            const leavesData = leavesRes.data?.data || [];
            setPendingLeaves(leavesData);

            // Announcements
            const annData = annRes.data?.data || [];
            setAnnouncements(annData.slice(0, 3));

            // Payroll due
            let payrollDue = 0;
            if (isManager) {
                try {
                    const payRes = await apiClient.get(`/hr/payroll?month=${currentMonth}&limit=100`);
                    const payrolls = payRes.data?.data || [];
                    payrollDue = payrolls.filter((p: any) => p.status === 'draft' || p.status === 'approved').length;
                } catch { /* ignore */ }
            }

            setStats({
                totalEmployees,
                presentToday,
                onLeaveToday,
                pendingLeaves: leavesRes.data?.meta?.total || leavesData.length,
                payrollDue,
                unreadAnnouncements: annRes.data?.meta?.unreadCount || 0,
            });
        } catch (error) {
            console.error('Failed to load HR overview:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchData();
    }, [session]);

    const handleLeaveAction = async (leaveId: string, action: 'approve' | 'reject') => {
        try {
            const res = await apiClient.post(`/hr/leaves/${leaveId}/action`, {
                action,
                reviewNotes: action === 'approve' ? 'Approved from HR Dashboard' : 'Rejected from HR Dashboard',
            });
            if (res.data.success) {
                message.success(`Leave ${action}d successfully`);
                fetchData();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || `Failed to ${action} leave`);
        }
    };

    const handleMarkRead = async (annId: string) => {
        try {
            await apiClient.put(`/hr/announcements/${annId}`, { action: 'mark_read' });
            fetchData();
        } catch (error) {
            message.error('Failed to mark as read');
        }
    };

    const attendanceColumns = [
        {
            title: 'Employee',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (name: string, rec: any) => (
                <Flex align="center" gap={8}>
                    <Avatar src={rec.avatar} size={32} style={{ backgroundColor: '#6C63FF' }}>
                        {name?.charAt(0)}
                    </Avatar>
                    <Text strong>{name}</Text>
                </Flex>
            ),
        },
        { title: 'Department', dataIndex: 'department', key: 'department', render: (d: string) => <Tag>{d}</Tag> },
        {
            title: 'Present', dataIndex: 'present', key: 'present',
            render: (v: number) => <Text style={{ color: '#52c41a', fontWeight: 600 }}>{v}</Text>
        },
        {
            title: 'Absent', dataIndex: 'absent', key: 'absent',
            render: (v: number) => <Text style={{ color: v > 3 ? '#ff4d4f' : '#8c8c8c', fontWeight: v > 3 ? 700 : 400 }}>{v}</Text>
        },
        {
            title: 'Leave', dataIndex: 'leave', key: 'leave',
            render: (v: number) => <Text style={{ color: '#1890ff' }}>{v}</Text>
        },
        {
            title: 'Half Day', dataIndex: 'halfDay', key: 'halfDay',
            render: (v: number) => <Text style={{ color: '#faad14' }}>{v}</Text>
        },
        {
            title: 'Total Hrs', dataIndex: 'totalHours', key: 'totalHours',
            render: (v: number) => <Text>{Math.round(v * 10) / 10}h</Text>
        },
    ];

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;

    return (
        <div>
            <PageHeader
                title="HR Dashboard"
                subtitle="Overview of your team, attendance, leaves, and announcements"
            />

            {/* Row 1 — Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <StatCard title="Total Employees" value={stats.totalEmployees} icon={<TeamOutlined />} color="#6C63FF" />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <StatCard title="Present Today" value={stats.presentToday} icon={<CheckCircleOutlined />} color="#52c41a" />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <StatCard title="On Leave Today" value={stats.onLeaveToday} icon={<CalendarOutlined />} color="#1890ff" />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon={<FileProtectOutlined />} color="#ff4d4f" badge />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <StatCard title="Payroll Due" value={stats.payrollDue} icon={<DollarOutlined />} color="#faad14" />
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                    <StatCard title="Unread Announcements" value={stats.unreadAnnouncements} icon={<NotificationOutlined />} color="#eb2f96" badge />
                </Col>
            </Row>

            {/* Row 2 — Attendance + Pending Leaves */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={14}>
                    <Card
                        title={<Text strong style={{ fontSize: 16 }}>Attendance Overview — {dayjs().format('MMMM YYYY')}</Text>}
                        extra={<TypoLink onClick={() => router.push('/hr/attendance')}>View All</TypoLink>}
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                        <Table
                            dataSource={attendanceData}
                            columns={attendanceColumns}
                            rowKey="_id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 600 }}
                            rowClassName={(rec: any) => {
                                if (rec.absent > 3) return 'row-danger';
                                return '';
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <Flex align="center" gap={8}>
                                <FileProtectOutlined style={{ color: '#ff4d4f' }} />
                                <Text strong style={{ fontSize: 16 }}>Pending Leave Requests</Text>
                                {stats.pendingLeaves > 0 && <Badge count={stats.pendingLeaves} color="#ff4d4f" size="small" />}
                            </Flex>
                        }
                        extra={<TypoLink onClick={() => router.push('/hr/leaves')}>View All</TypoLink>}
                        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        styles={{ body: { padding: '12px 24px' } }}
                    >
                        {pendingLeaves.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pending leave requests" />
                        ) : (
                            <Flex vertical>
                                {pendingLeaves.slice(0, 5).map((leave: any) => {
                                    const emp = leave.employeeId;
                                    return (
                                        <div key={leave._id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                                                <Flex align="center" gap={8} style={{ flex: 1 }}>
                                                    <Avatar src={emp?.avatar} size={36} style={{ backgroundColor: '#6C63FF' }}>
                                                        {emp?.fullName?.charAt(0)}
                                                    </Avatar>
                                                    <div>
                                                        <Text strong style={{ display: 'block' }}>{emp?.fullName}</Text>
                                                        <Space size={4}>
                                                            <Tag color={leaveTypeColors[leave.leaveType]} style={{ margin: 0 }}>
                                                                {leave.leaveType}
                                                            </Tag>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                {dayjs(leave.startDate).format('DD MMM')} — {dayjs(leave.endDate).format('DD MMM')}
                                                            </Text>
                                                            <Tag style={{ margin: 0 }}>{leave.totalDays}d</Tag>
                                                        </Space>
                                                    </div>
                                                </Flex>
                                                {isManager && (
                                                    <Space>
                                                        <Tooltip title="Approve">
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={<CheckOutlined />}
                                                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                                                onClick={() => handleLeaveAction(leave._id, 'approve')}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title="Reject">
                                                            <Button
                                                                danger
                                                                size="small"
                                                                icon={<CloseOutlined />}
                                                                onClick={() => handleLeaveAction(leave._id, 'reject')}
                                                            />
                                                        </Tooltip>
                                                    </Space>
                                                )}
                                            </Flex>
                                        </div>
                                    );
                                })}
                            </Flex>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Row 3 — Announcements */}
            <Card
                title={
                    <Flex align="center" gap={8}>
                        <NotificationOutlined style={{ color: '#eb2f96' }} />
                        <Text strong style={{ fontSize: 16 }}>Recent Announcements</Text>
                    </Flex>
                }
                extra={<TypoLink onClick={() => router.push('/hr/announcements')}>View All</TypoLink>}
                style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
                {announcements.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No announcements" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {announcements.map((ann: any) => (
                            <Col xs={24} md={8} key={ann._id}>
                                <Card
                                    size="small"
                                    style={{
                                        borderRadius: 10,
                                        backgroundColor: ann.isPinned ? '#fffbe6' : '#fafafa',
                                        border: ann.isPinned ? '1px solid #ffe58f' : '1px solid #f0f0f0',
                                    }}
                                >
                                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                                        <Space size={4}>
                                            {ann.isPinned && <PushpinFilled style={{ color: '#faad14' }} />}
                                            <Tag color={announcementTypeColors[ann.type]}>{ann.type}</Tag>
                                            {ann.priority === 'high' && <Tag color="red">HIGH</Tag>}
                                        </Space>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {dayjs(ann.createdAt).fromNow()}
                                        </Text>
                                    </Flex>
                                    <Title level={5} style={{ margin: '0 0 4px 0' }}>{ann.title}</Title>
                                    <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: '0 0 8px 0', fontSize: 13 }}>
                                        {ann.content}
                                    </Paragraph>
                                    <Flex justify="space-between" align="center">
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            <ReadOutlined /> {ann.readBy?.length || 0} read
                                        </Text>
                                        {!ann.readByMe && (
                                            <Button size="small" type="link" onClick={() => handleMarkRead(ann._id)}>
                                                Mark as Read
                                            </Button>
                                        )}
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card>

            <style jsx global>{`
                .row-danger td { background-color: #fff1f0 !important; }
            `}</style>
        </div>
    );
}
