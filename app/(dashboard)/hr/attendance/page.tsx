'use client';

import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Space, Flex, Select, Input, App, Spin, Card, Row, Col, Avatar, Progress, Tag } from 'antd';
import { CalendarOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import AttendanceCalendar from '@/components/hr/attendance/AttendanceCalendar';
import MarkAttendanceModal from '@/components/hr/attendance/MarkAttendanceModal';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function AttendancePage() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [markOpen, setMarkOpen] = useState(false);
    const [empSummaries, setEmpSummaries] = useState<Map<string, any>>(new Map());

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await apiClient.get('/hr/employees?limit=100&status=active');
            if (res.data.success) {
                setEmployees(res.data.data || []);
                if (!selectedEmployeeId && res.data.data?.length > 0) {
                    setSelectedEmployeeId(res.data.data[0]._id);
                }
            }
        } catch { /* ignore */ }
    }, []);

    const fetchAttendance = useCallback(async () => {
        if (!selectedEmployeeId) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`/hr/attendance?employeeId=${selectedEmployeeId}&month=${month}&limit=50`);
            if (res.data.success) {
                setAttendanceRecords(res.data.data);
                setSummary(res.data.summary);
            }
        } catch {
            message.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    }, [selectedEmployeeId, month, message]);

    const fetchAllAttendance = useCallback(async () => {
        try {
            const res = await apiClient.get(`/hr/attendance?month=${month}&limit=500`);
            if (res.data.success) {
                const records = res.data.data || [];
                const summaryMap = new Map<string, any>();
                for (const emp of employees) {
                    summaryMap.set(emp._id, { present: 0, total: 0, totalHours: 0 });
                }
                for (const rec of records) {
                    const empId = typeof rec.employeeId === 'object' ? rec.employeeId?._id : rec.employeeId;
                    const entry = summaryMap.get(empId);
                    if (entry) {
                        entry.total++;
                        if (['present', 'work_from_home'].includes(rec.status)) entry.present++;
                        entry.totalHours += rec.totalHours || 0;
                    }
                }
                setEmpSummaries(summaryMap);
            }
        } catch { /* ignore */ }
    }, [month, employees]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => { if (selectedEmployeeId) fetchAttendance(); }, [fetchAttendance]);
    useEffect(() => { if (employees.length) fetchAllAttendance(); }, [fetchAllAttendance, employees]);

    const workingDaysInMonth = (() => {
        const start = dayjs(month).startOf('month');
        const end = dayjs(month).endOf('month');
        let count = 0;
        let cur = start;
        while (cur.isBefore(end) || cur.isSame(end, 'day')) {
            if (cur.day() !== 0) count++;
            cur = cur.add(1, 'day');
        }
        return count;
    })();

    const selectedEmployee = employees.find(e => e._id === selectedEmployeeId);

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <PageHeader title="Attendance" subtitle={`${dayjs(month).format('MMMM YYYY')}`} />
                <Space>
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 180 }} />
                    {isManager && (
                        <Select
                            showSearch
                            placeholder="Filter Employee"
                            style={{ width: 200 }}
                            value={selectedEmployeeId}
                            onChange={(v) => setSelectedEmployeeId(v)}
                            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                            options={employees.map(e => ({ label: e.fullName, value: e._id }))}
                        />
                    )}
                    {isManager && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setMarkOpen(true)}>
                            Mark Attendance
                        </Button>
                    )}
                </Space>
            </Flex>

            <Row gutter={[24, 24]}>
                {/* Left: Employee List */}
                <Col xs={24} lg={8}>
                    <Card title="Team Overview" style={{ borderRadius: 12 }} styles={{ body: { padding: '12px' } }}>
                        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                            {employees.map(emp => {
                                const empSummary = empSummaries.get(emp._id);
                                const present = empSummary?.present || 0;
                                const pct = workingDaysInMonth > 0 ? Math.round((present / workingDaysInMonth) * 100) : 0;
                                const isSelected = emp._id === selectedEmployeeId;
                                return (
                                    <div
                                        key={emp._id}
                                        onClick={() => setSelectedEmployeeId(emp._id)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                                            border: isSelected ? '1px solid #91d5ff' : '1px solid transparent',
                                            marginBottom: 4,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Flex align="center" gap={10}>
                                            <Avatar src={emp.avatar} size={36} style={{ backgroundColor: '#6C63FF' }}>
                                                {emp.fullName?.charAt(0)}
                                            </Avatar>
                                            <div style={{ flex: 1 }}>
                                                <Text strong style={{ fontSize: 13 }}>{emp.fullName}</Text>
                                                <Flex align="center" gap={4}>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>{present}/{workingDaysInMonth}</Text>
                                                    <Progress percent={pct} size="small" showInfo={false} style={{ flex: 1 }}
                                                        strokeColor={pct >= 80 ? '#52c41a' : pct >= 60 ? '#faad14' : '#ff4d4f'} />
                                                </Flex>
                                            </div>
                                        </Flex>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </Col>

                {/* Right: Calendar */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Flex align="center" gap={8}>
                                <CalendarOutlined />
                                <Text strong>{selectedEmployee?.fullName || 'Select an employee'} — {dayjs(month).format('MMMM YYYY')}</Text>
                            </Flex>
                        }
                        style={{ borderRadius: 12 }}
                    >
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin /></div>
                        ) : (
                            <>
                                <AttendanceCalendar records={attendanceRecords} month={month} />
                                {summary && (
                                    <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                                        <Col span={4}><Card size="small" style={{ textAlign: 'center', borderRadius: 8, backgroundColor: '#f6ffed' }}><Text strong style={{ color: '#52c41a' }}>{summary.presentDays}</Text><br /><Text type="secondary" style={{ fontSize: 10 }}>Present</Text></Card></Col>
                                        <Col span={4}><Card size="small" style={{ textAlign: 'center', borderRadius: 8, backgroundColor: '#fff1f0' }}><Text strong style={{ color: '#ff4d4f' }}>{summary.absentDays}</Text><br /><Text type="secondary" style={{ fontSize: 10 }}>Absent</Text></Card></Col>
                                        <Col span={4}><Card size="small" style={{ textAlign: 'center', borderRadius: 8, backgroundColor: '#e6f7ff' }}><Text strong style={{ color: '#1890ff' }}>{summary.leaveDays}</Text><br /><Text type="secondary" style={{ fontSize: 10 }}>Leave</Text></Card></Col>
                                        <Col span={4}><Card size="small" style={{ textAlign: 'center', borderRadius: 8, backgroundColor: '#fffbe6' }}><Text strong style={{ color: '#faad14' }}>{summary.halfDays}</Text><br /><Text type="secondary" style={{ fontSize: 10 }}>Half Day</Text></Card></Col>
                                        <Col span={4}><Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}><Text strong>{Math.round(summary.totalHours * 10) / 10}h</Text><br /><Text type="secondary" style={{ fontSize: 10 }}>Total Hrs</Text></Card></Col>
                                        <Col span={4}><Card size="small" style={{ textAlign: 'center', borderRadius: 8 }}><Text strong style={{ color: '#722ed1' }}>{Math.round(summary.overtimeHours * 10) / 10}h</Text><br /><Text type="secondary" style={{ fontSize: 10 }}>Overtime</Text></Card></Col>
                                    </Row>
                                )}
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            {selectedEmployee && (
                <MarkAttendanceModal
                    open={markOpen}
                    onClose={() => setMarkOpen(false)}
                    employeeId={selectedEmployeeId!}
                    employeeName={selectedEmployee.fullName}
                    onSuccess={() => { fetchAttendance(); fetchAllAttendance(); }}
                />
            )}
        </div>
    );
}
