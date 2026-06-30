'use client';

import { useEffect, useState } from 'react';
import {
    Drawer, Form, Input, Select, DatePicker, InputNumber, Radio, Button, Tabs, Flex, Space, Typography, Divider, App,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Text } = Typography;

interface EmployeeDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
}

export default function EmployeeDrawer({ open, onClose, onSubmit, initialData }: EmployeeDrawerProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [paymentMode, setPaymentMode] = useState('bank_transfer');

    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchEmployees();
            if (initialData) {
                const vals = {
                    ...initialData,
                    dateOfBirth: initialData.dateOfBirth ? dayjs(initialData.dateOfBirth) : undefined,
                    joiningDate: initialData.joiningDate ? dayjs(initialData.joiningDate) : undefined,
                    probationEndDate: initialData.probationEndDate ? dayjs(initialData.probationEndDate) : undefined,
                    confirmationDate: initialData.confirmationDate ? dayjs(initialData.confirmationDate) : undefined,
                    userId: initialData.userId?._id || initialData.userId,
                    reportingManager: initialData.reportingManager?._id || initialData.reportingManager,
                };
                form.setFieldsValue(vals);
                setPaymentMode(initialData.salaryStructure?.paymentMode || 'bank_transfer');
            } else {
                form.resetFields();
                form.setFieldsValue({
                    gender: 'male',
                    employmentType: 'full_time',
                    salaryStructure: { basicSalary: 0, hra: 0, allowances: 0, variableComponent: 0, paymentMode: 'bank_transfer' },
                    leaveBalance: { annual: 12, sick: 6, casual: 6, unpaid: 0 },
                });
                setPaymentMode('bank_transfer');
            }
        }
    }, [open, initialData, form]);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/users?limit=100');
            if (res.data.success) setUsers(res.data.data || []);
        } catch { /* ignore */ }
    };

    const fetchEmployees = async () => {
        try {
            const res = await apiClient.get('/hr/employees?limit=100');
            if (res.data.success) setEmployees(res.data.data || []);
        } catch { /* ignore */ }
    };

    const handleFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                dateOfBirth: values.dateOfBirth?.toISOString(),
                joiningDate: values.joiningDate?.toISOString(),
                probationEndDate: values.probationEndDate?.toISOString(),
                confirmationDate: values.confirmationDate?.toISOString(),
                equipmentAssigned: values.equipmentAssigned?.map((eq: any) => ({
                    ...eq,
                    assignedDate: eq.assignedDate?.toISOString?.() || eq.assignedDate,
                })),
            };
            await onSubmit(payload);
        } finally {
            setLoading(false);
        }
    };

    const basicSalary = Form.useWatch(['salaryStructure', 'basicSalary'], form) || 0;
    const hra = Form.useWatch(['salaryStructure', 'hra'], form) || 0;
    const allowances = Form.useWatch(['salaryStructure', 'allowances'], form) || 0;
    const totalCTC = basicSalary + hra + allowances;

    const linkedUserIds = employees
        .filter(e => e._id !== initialData?._id)
        .map(e => e.userId?._id || e.userId)
        .filter(Boolean);

    const availableUsers = users.filter(u => !linkedUserIds.includes(u._id));

    return (
        <Drawer
            title={initialData ? 'Edit Employee' : 'Add Employee'}
            open={open}
            onClose={onClose}
            width={640}
            destroyOnHidden
            footer={
                <Flex justify="end" gap={8}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" loading={loading} onClick={() => form.submit()}>
                        {initialData ? 'Update' : 'Create'} Employee
                    </Button>
                </Flex>
            }
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Tabs
                    items={[
                        {
                            key: 'personal',
                            label: 'Personal Info',
                            children: (
                                <>
                                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <Flex gap={12}>
                                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]} style={{ flex: 1 }}>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item name="phone" label="Phone" rules={[{ required: true }]} style={{ flex: 1 }}>
                                            <Input />
                                        </Form.Item>
                                    </Flex>
                                    <Flex gap={12}>
                                        <Form.Item name="whatsappNumber" label="WhatsApp" style={{ flex: 1 }}>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item name="personalEmail" label="Personal Email" style={{ flex: 1 }}>
                                            <Input />
                                        </Form.Item>
                                    </Flex>
                                    <Flex gap={12}>
                                        <Form.Item name="dateOfBirth" label="Date of Birth" style={{ flex: 1 }}>
                                            <DatePicker style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item name="gender" label="Gender" rules={[{ required: true }]} style={{ flex: 1 }}>
                                            <Radio.Group>
                                                <Radio value="male">Male</Radio>
                                                <Radio value="female">Female</Radio>
                                                <Radio value="other">Other</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Flex>
                                    <Form.Item name="bloodGroup" label="Blood Group">
                                        <Select allowClear options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ label: v, value: v }))} />
                                    </Form.Item>
                                    <Divider>Emergency Contact</Divider>
                                    <Flex gap={12}>
                                        <Form.Item name={['emergencyContact', 'name']} label="Name" style={{ flex: 1 }}><Input /></Form.Item>
                                        <Form.Item name={['emergencyContact', 'relation']} label="Relation" style={{ flex: 1 }}><Input /></Form.Item>
                                        <Form.Item name={['emergencyContact', 'phone']} label="Phone" style={{ flex: 1 }}><Input /></Form.Item>
                                    </Flex>
                                    <Divider>Address</Divider>
                                    <Form.Item name={['address', 'street']} label="Street"><Input /></Form.Item>
                                    <Flex gap={12}>
                                        <Form.Item name={['address', 'city']} label="City" style={{ flex: 1 }}><Input /></Form.Item>
                                        <Form.Item name={['address', 'state']} label="State" style={{ flex: 1 }}><Input /></Form.Item>
                                        <Form.Item name={['address', 'pincode']} label="Pincode" style={{ flex: 1 }}><Input /></Form.Item>
                                    </Flex>
                                </>
                            ),
                        },
                        {
                            key: 'job',
                            label: 'Job Info',
                            children: (
                                <>
                                    <Form.Item name="userId" label="Link User Account" rules={[{ required: true }]}>
                                        <Select
                                            showSearch
                                            placeholder="Select user account"
                                            filterOption={(input, option) =>
                                                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={availableUsers.map(u => ({ label: `${u.name} (${u.email})`, value: u._id }))}
                                            disabled={!!initialData}
                                        />
                                    </Form.Item>
                                    <Flex gap={12}>
                                        <Form.Item name="department" label="Department" rules={[{ required: true }]} style={{ flex: 1 }}>
                                            <Select options={['Management', 'Operations', 'Production', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'].map(d => ({ label: d, value: d }))} />
                                        </Form.Item>
                                        <Form.Item name="designation" label="Designation" rules={[{ required: true }]} style={{ flex: 1 }}>
                                            <Input />
                                        </Form.Item>
                                    </Flex>
                                    <Flex gap={12}>
                                        <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true }]} style={{ flex: 1 }}>
                                            <Select options={[
                                                { label: 'Full Time', value: 'full_time' },
                                                { label: 'Part Time', value: 'part_time' },
                                                { label: 'Freelancer', value: 'freelancer' },
                                                { label: 'Intern', value: 'intern' },
                                            ]} />
                                        </Form.Item>
                                        <Form.Item name="joiningDate" label="Joining Date" rules={[{ required: true }]} style={{ flex: 1 }}>
                                            <DatePicker style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Flex>
                                    <Flex gap={12}>
                                        <Form.Item name="probationEndDate" label="Probation End Date" style={{ flex: 1 }}>
                                            <DatePicker style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item name="reportingManager" label="Reporting Manager" style={{ flex: 1 }}>
                                            <Select
                                                showSearch allowClear
                                                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                                                options={employees.filter(e => e._id !== initialData?._id).map(e => ({ label: `${e.fullName} (${e.employeeNumber})`, value: e._id }))}
                                            />
                                        </Form.Item>
                                    </Flex>
                                    <Form.Item name="skills" label="Skills">
                                        <Select mode="tags" placeholder="Type and press Enter to add skills" />
                                    </Form.Item>
                                </>
                            ),
                        },
                        {
                            key: 'compensation',
                            label: 'Compensation',
                            children: (
                                <>
                                    <Flex gap={12}>
                                        <Form.Item name={['salaryStructure', 'basicSalary']} label="Basic Salary (₹)" style={{ flex: 1 }}>
                                            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
                                        </Form.Item>
                                        <Form.Item name={['salaryStructure', 'hra']} label="HRA (₹)" style={{ flex: 1 }}>
                                            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
                                        </Form.Item>
                                    </Flex>
                                    <Flex gap={12}>
                                        <Form.Item name={['salaryStructure', 'allowances']} label="Allowances (₹)" style={{ flex: 1 }}>
                                            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
                                        </Form.Item>
                                        <Form.Item label="Total Fixed CTC (₹)" style={{ flex: 1 }}>
                                            <InputNumber style={{ width: '100%' }} value={totalCTC} disabled prefix="₹" />
                                        </Form.Item>
                                    </Flex>
                                    <Form.Item name={['salaryStructure', 'variableComponent']} label="Variable Component Max (₹)">
                                        <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
                                    </Form.Item>
                                    <Form.Item name={['salaryStructure', 'paymentMode']} label="Payment Mode">
                                        <Select onChange={(v) => setPaymentMode(v)} options={[
                                            { label: 'Bank Transfer', value: 'bank_transfer' },
                                            { label: 'UPI', value: 'upi' },
                                            { label: 'Cash', value: 'cash' },
                                        ]} />
                                    </Form.Item>
                                    {paymentMode === 'bank_transfer' && (
                                        <>
                                            <Flex gap={12}>
                                                <Form.Item name={['salaryStructure', 'bankDetails', 'accountName']} label="Account Name" style={{ flex: 1 }}><Input /></Form.Item>
                                                <Form.Item name={['salaryStructure', 'bankDetails', 'accountNumber']} label="Account Number" style={{ flex: 1 }}><Input /></Form.Item>
                                            </Flex>
                                            <Flex gap={12}>
                                                <Form.Item name={['salaryStructure', 'bankDetails', 'ifscCode']} label="IFSC Code" style={{ flex: 1 }}><Input /></Form.Item>
                                                <Form.Item name={['salaryStructure', 'bankDetails', 'bankName']} label="Bank Name" style={{ flex: 1 }}><Input /></Form.Item>
                                            </Flex>
                                        </>
                                    )}
                                    {paymentMode === 'upi' && (
                                        <Form.Item name={['salaryStructure', 'upiId']} label="UPI ID"><Input /></Form.Item>
                                    )}
                                </>
                            ),
                        },
                        {
                            key: 'equipment',
                            label: 'Equipment',
                            children: (
                                <Form.List name="equipmentAssigned">
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <Flex key={key} gap={8} align="start">
                                                    <Form.Item {...restField} name={[name, 'name']} style={{ flex: 2 }}>
                                                        <Input placeholder="Equipment Name" />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'serialNumber']} style={{ flex: 2 }}>
                                                        <Input placeholder="Serial Number" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 8, color: '#ff4d4f' }} />
                                                </Flex>
                                            ))}
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Add Equipment
                                            </Button>
                                        </>
                                    )}
                                </Form.List>
                            ),
                        },
                        {
                            key: 'leave',
                            label: 'Leave Balance',
                            children: (
                                <Flex gap={12} wrap="wrap">
                                    <Form.Item name={['leaveBalance', 'annual']} label="Annual Leave" style={{ flex: 1 }}>
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                    <Form.Item name={['leaveBalance', 'sick']} label="Sick Leave" style={{ flex: 1 }}>
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                    <Form.Item name={['leaveBalance', 'casual']} label="Casual Leave" style={{ flex: 1 }}>
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                    <Form.Item name={['leaveBalance', 'unpaid']} label="Unpaid Leave" style={{ flex: 1 }}>
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Flex>
                            ),
                        },
                    ]}
                />
            </Form>
        </Drawer>
    );
}
