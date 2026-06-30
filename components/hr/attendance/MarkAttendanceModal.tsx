'use client';

import { useState } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Input, InputNumber, Typography, App } from 'antd';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Text } = Typography;

interface MarkAttendanceModalProps {
    open: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
    onSuccess: () => void;
    defaultDate?: string;
}

export default function MarkAttendanceModal({ open, onClose, employeeId, employeeName, onSuccess, defaultDate }: MarkAttendanceModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    const status = Form.useWatch('status', form);
    const checkIn = Form.useWatch('checkIn', form);
    const checkOut = Form.useWatch('checkOut', form);

    const totalHours = checkIn && checkOut
        ? Math.max(0, Math.round((checkOut.diff(checkIn, 'minute') / 60) * 100) / 100)
        : 0;

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                employeeId,
                date: values.date.format('YYYY-MM-DD'),
                status: values.status,
                checkIn: values.checkIn ? values.date.hour(values.checkIn.hour()).minute(values.checkIn.minute()).toISOString() : null,
                checkOut: values.checkOut ? values.date.hour(values.checkOut.hour()).minute(values.checkOut.minute()).toISOString() : null,
                notes: values.notes || '',
            };
            const res = await apiClient.post('/hr/attendance', payload);
            if (res.data.success) {
                message.success('Attendance marked successfully');
                form.resetFields();
                onClose();
                onSuccess();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`Mark Attendance — ${employeeName}`}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            destroyOnHidden
            width={480}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    date: defaultDate ? dayjs(defaultDate) : dayjs(),
                    status: 'present',
                }}
            >
                <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                    <Select options={[
                        { label: 'Present', value: 'present' },
                        { label: 'Absent', value: 'absent' },
                        { label: 'Half Day', value: 'half_day' },
                        { label: 'Work From Home', value: 'work_from_home' },
                        { label: 'Holiday', value: 'holiday' },
                        { label: 'On Leave', value: 'on_leave' },
                    ]} />
                </Form.Item>
                {(status === 'present' || status === 'work_from_home' || status === 'half_day') && (
                    <>
                        <Form.Item name="checkIn" label="Check In Time">
                            <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="checkOut" label="Check Out Time">
                            <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                        <div style={{ padding: '8px 12px', backgroundColor: '#f6ffed', borderRadius: 8, marginBottom: 16 }}>
                            <Text>Total Hours: <Text strong style={{ color: '#52c41a' }}>{totalHours}h</Text></Text>
                        </div>
                    </>
                )}
                <Form.Item name="notes" label="Notes">
                    <Input.TextArea rows={2} placeholder="Optional notes..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}
