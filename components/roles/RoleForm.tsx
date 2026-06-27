'use client';

import { useState, useEffect } from 'react';
import { 
    Modal, 
    Form, 
    Input, 
    Table, 
    Checkbox, 
    Typography, 
    Row, 
    Col, 
    Button,
    Space
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const modules = [
    'leads', 'clients', 'projects', 'tasks', 'scripts', 'shoots', 'editing',
    'thumbnails', 'captions', 'approvals', 'publishing', 'analytics',
    'users', 'roles', 'hr', 'finance', 'meetings', 'assets', 'vendors'
];

const actionsList = ['read', 'create', 'update', 'delete'];

interface RoleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    loading: boolean;
}

export default function RoleForm({ open, onClose, onSubmit, initialData, loading }: RoleFormProps) {
    const [form] = Form.useForm();
    const [permissions, setPermissions] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    name: initialData.name,
                    slug: initialData.slug,
                });
                setPermissions(initialData.permissions || []);
            } else {
                form.resetFields();
                setPermissions(modules.map(m => ({ module: m, actions: [] })));
            }
        }
    }, [initialData, open, form]);

    const handleTogglePermission = (module: string, action: string) => {
        setPermissions(prev => {
            const existing = prev.find(p => p.module === module);
            if (existing) {
                const newActions = existing.actions.includes(action)
                    ? existing.actions.filter((a: string) => a !== action)
                    : [...existing.actions, action];

                return prev.map(p => p.module === module ? { ...p, actions: newActions } : p);
            } else {
                return [...prev, { module, actions: [action] }];
            }
        });
    };

    const handleSave = () => {
        form.validateFields().then(values => {
            onSubmit({ ...values, permissions });
        });
    };

    const columns: ColumnsType<any> = [
        {
            title: 'Module',
            dataIndex: 'module',
            key: 'module',
            render: (text) => <Text style={{ textTransform: 'capitalize' }}>{text}</Text>,
        },
        ...actionsList.map(action => ({
            title: action.toUpperCase(),
            key: action,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Checkbox
                    checked={permissions.find(p => p.module === record.module)?.actions.includes(action) || false}
                    onChange={() => handleTogglePermission(record.module, action)}
                />
            ),
        })),
    ];

    const moduleData = modules.map(m => ({ key: m, module: m }));

    return (
        <Modal
            title={<Text strong style={{ fontSize: 18 }}>{initialData ? 'Edit Role' : 'Add New Role'}</Text>}
            open={open}
            onCancel={onClose}
            onOk={handleSave}
            confirmLoading={loading}
            width={800}
            okText="Save Changes"
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 24 }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item 
                            name="name" 
                            label="Role Name" 
                            rules={[{ required: true, message: 'Role name is required' }]}
                        >
                            <Input placeholder="e.g. Account Manager" disabled={initialData?.isSystem} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            name="slug" 
                            label="Slug" 
                            rules={[{ required: true, message: 'Slug is required' }]}
                        >
                            <Input placeholder="e.g. account-manager" disabled={!!initialData} />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 13, color: '#6C63FF' }}>PERMISSIONS MATRIX</Text>
                </div>

                <Table 
                    columns={columns} 
                    dataSource={moduleData} 
                    pagination={false} 
                    scroll={{ y: 400 }}
                    size="small"
                    bordered
                    style={{ borderRadius: 8, overflow: 'hidden' }}
                />
            </Form>
        </Modal>
    );
}
