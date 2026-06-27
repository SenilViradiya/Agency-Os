'use client';

import {
    Form,
    Input,
    Button,
    Select,
    Space,
    Row,
    Col
} from 'antd';
import { useEffect } from 'react';

const { Option } = Select;

interface UserFormProps {
    initialData?: any;
    roles: any[];
    onSubmit: (data: any) => void;
    loading: boolean;
    isEdit?: boolean;
}

export default function UserForm({
    initialData,
    roles,
    onSubmit,
    loading,
    isEdit = false,
}: UserFormProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                role: initialData.role?._id || initialData.role,
                password: '',
            });
        }
    }, [initialData, form]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            requiredMark="optional"
            initialValues={{ status: 'active' }}
        >
            <Row gutter={24}>
                <Col span={24}>
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter full name' }]}
                    >
                        <Input placeholder="John Doe" size="large" />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                    >
                        <Input placeholder="john@example.com" disabled={isEdit} size="large" />
                    </Form.Item>
                </Col>
                {!isEdit && (
                    <Col span={24}>
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
                        >
                            <Input.Password placeholder="Min 6 characters" size="large" />
                        </Form.Item>
                    </Col>
                )}
                <Col xs={24} sm={12}>
                    <Form.Item name="phone" label="Phone">
                        <Input placeholder="Phone number" size="large" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select placeholder="Select role" size="large">
                            {roles.map((role) => (
                                <Option key={role._id} value={role._id}>
                                    {role.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="department"
                        label="Department"
                        rules={[{ required: true, message: 'Department is required' }]}
                    >
                        <Input placeholder="e.g. Creative" size="large" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        name="designation"
                        label="Designation"
                        rules={[{ required: true, message: 'Designation is required' }]}
                    >
                        <Input placeholder="e.g. Senior Editor" size="large" />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true }]}
                    >
                        <Select size="large">
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                            <Option value="suspended">Suspended</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
                <Space>
                    <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ minWidth: 150 }}>
                        {isEdit ? 'Update User' : 'Create User'}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
}
