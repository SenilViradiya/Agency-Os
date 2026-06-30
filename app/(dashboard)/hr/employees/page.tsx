'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import {
    Typography, Button, Space, Segmented, Flex, Select, Input, App, Badge, Spin, Card, Row, Col, Tag, Avatar, Table, Tooltip,
} from 'antd';
import {
    PlusOutlined, AppstoreOutlined, UnorderedListOutlined, FilterOutlined,
    PhoneOutlined, WhatsAppOutlined, EyeOutlined, SearchOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeDrawer from '@/components/hr/employees/EmployeeDrawer';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Text } = Typography;

const statusColors: Record<string, string> = {
    active: 'green', on_leave: 'blue', resigned: 'orange', terminated: 'red',
};
const typeColors: Record<string, string> = {
    full_time: 'blue', part_time: 'cyan', freelancer: 'purple', intern: 'green',
};
const typeLabels: Record<string, string> = {
    full_time: 'Full Time', part_time: 'Part Time', freelancer: 'Freelancer', intern: 'Intern',
};

function EmployeesContent() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const router = useRouter();
    const [view, setView] = useState<'card' | 'table'>('card');
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [filters, setFilters] = useState({ department: undefined as string | undefined, employmentType: undefined as string | undefined, status: undefined as string | undefined, search: '' });

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/hr/employees?limit=100';
            if (filters.department) url += `&department=${filters.department}`;
            if (filters.employmentType) url += `&employmentType=${filters.employmentType}`;
            if (filters.status) url += `&status=${filters.status}`;
            if (filters.search) url += `&search=${filters.search}`;
            const res = await apiClient.get(url);
            if (res.data.success) setEmployees(res.data.data);
        } catch (error) {
            message.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    }, [filters, message]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const handleSave = async (values: any) => {
        try {
            if (selectedEmployee) {
                const res = await apiClient.put(`/hr/employees/${selectedEmployee._id}`, values);
                if (res.data.success) { message.success('Employee updated'); setDrawerOpen(false); fetchEmployees(); }
            } else {
                const res = await apiClient.post('/hr/employees', values);
                if (res.data.success) { message.success('Employee created'); setDrawerOpen(false); fetchEmployees(); }
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save employee');
        }
    };

    const columns = [
        {
            title: 'EMP#', dataIndex: 'employeeNumber', key: 'employeeNumber', width: 100,
            render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
        },
        {
            title: 'Employee', dataIndex: 'fullName', key: 'fullName',
            render: (name: string, rec: any) => (
                <Flex align="center" gap={8}>
                    <Avatar src={rec.avatar} style={{ backgroundColor: '#6C63FF' }}>{name?.charAt(0)}</Avatar>
                    <Text strong>{name}</Text>
                </Flex>
            ),
        },
        { title: 'Department', dataIndex: 'department', key: 'department', render: (d: string) => <Tag>{d}</Tag> },
        { title: 'Designation', dataIndex: 'designation', key: 'designation' },
        {
            title: 'Type', dataIndex: 'employmentType', key: 'employmentType',
            render: (t: string) => <Tag color={typeColors[t]}>{typeLabels[t]}</Tag>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (s: string) => <Badge status={s === 'active' ? 'success' : s === 'terminated' ? 'error' : 'warning'} text={s.replace('_', ' ')} />,
        },
        {
            title: 'Joining Date', dataIndex: 'joiningDate', key: 'joiningDate',
            render: (d: string) => dayjs(d).format('DD MMM YYYY'),
        },
        {
            title: 'Actions', key: 'actions', width: 80,
            render: (_: any, rec: any) => (
                <Tooltip title="View Profile">
                    <Button type="link" icon={<EyeOutlined />} onClick={() => router.push(`/hr/employees/${rec._id}`)} />
                </Tooltip>
            ),
        },
    ];

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <Space size="middle">
                    <PageHeader title="Employees" subtitle={`${employees.length} team members`} />
                </Space>
                <Space>
                    <Segmented
                        options={[
                            { label: <><AppstoreOutlined /> Cards</>, value: 'card' },
                            { label: <><UnorderedListOutlined /> Table</>, value: 'table' },
                        ]}
                        value={view}
                        onChange={(v) => setView(v as 'card' | 'table')}
                    />
                    {isManager && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedEmployee(null); setDrawerOpen(true); }} size="large">
                            Add Employee
                        </Button>
                    )}
                </Space>
            </Flex>

            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Flex gap={16} align="center" wrap="wrap">
                    <FilterOutlined style={{ color: '#8c8c8c' }} />
                    <Select placeholder="Department" style={{ width: 160 }} allowClear onChange={(v) => setFilters({ ...filters, department: v })} options={departments.map(d => ({ label: d, value: d }))} />
                    <Select placeholder="Employment Type" style={{ width: 160 }} allowClear onChange={(v) => setFilters({ ...filters, employmentType: v })} options={[
                        { label: 'Full Time', value: 'full_time' },
                        { label: 'Part Time', value: 'part_time' },
                        { label: 'Freelancer', value: 'freelancer' },
                        { label: 'Intern', value: 'intern' },
                    ]} />
                    <Select placeholder="Status" style={{ width: 140 }} allowClear onChange={(v) => setFilters({ ...filters, status: v })} options={[
                        { label: 'Active', value: 'active' },
                        { label: 'On Leave', value: 'on_leave' },
                        { label: 'Resigned', value: 'resigned' },
                        { label: 'Terminated', value: 'terminated' },
                    ]} />
                    <Input placeholder="Search employees..." prefix={<SearchOutlined />} style={{ width: 200 }} allowClear onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                </Flex>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
            ) : view === 'card' ? (
                <Row gutter={[16, 16]}>
                    {employees.map((emp) => (
                        <Col xs={24} sm={12} lg={8} key={emp._id}>
                            <Card
                                hoverable
                                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                styles={{ body: { padding: 20 } }}
                            >
                                <Flex vertical align="center" gap={8} style={{ marginBottom: 12 }}>
                                    <Avatar src={emp.avatar} size={64} style={{ backgroundColor: '#6C63FF', fontSize: 24 }}>
                                        {emp.fullName?.charAt(0)}
                                    </Avatar>
                                    <Text strong style={{ fontSize: 16 }}>{emp.fullName}</Text>
                                    <Text type="secondary">{emp.designation}</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{emp.employeeNumber}</Text>
                                </Flex>
                                <Flex justify="center" gap={6} style={{ marginBottom: 12 }}>
                                    <Tag>{emp.department}</Tag>
                                    <Tag color={typeColors[emp.employmentType]}>{typeLabels[emp.employmentType]}</Tag>
                                    <Badge status={emp.status === 'active' ? 'success' : 'error'} text={emp.status} />
                                </Flex>
                                <Flex justify="center" gap={12} style={{ marginBottom: 12 }}>
                                    {emp.phone && (
                                        <Tooltip title={emp.phone}>
                                            <Button type="text" size="small" icon={<PhoneOutlined />} />
                                        </Tooltip>
                                    )}
                                    {emp.whatsappNumber && (
                                        <Tooltip title={emp.whatsappNumber}>
                                            <Button type="text" size="small" icon={<WhatsAppOutlined style={{ color: '#25D366' }} />} />
                                        </Tooltip>
                                    )}
                                </Flex>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: 'center', marginBottom: 12 }}>
                                    Joined: {dayjs(emp.joiningDate).format('DD MMM YYYY')}
                                </Text>
                                <Button type="primary" block style={{ borderRadius: 8 }} onClick={() => router.push(`/hr/employees/${emp._id}`)}>
                                    View Profile
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Table dataSource={employees} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
            )}

            <EmployeeDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleSave}
                initialData={selectedEmployee}
            />
        </div>
    );
}

export default function EmployeesPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>}>
            <EmployeesContent />
        </Suspense>
    );
}
