import { useState, useEffect } from 'react';
import { Select, Avatar, Space, Typography, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;

interface UserSelectProps {
    value?: string | string[];
    onChange?: (value: any) => void;
    label: string;
    multiple?: boolean;
    status?: "" | "error" | "warning";
    helperText?: string;
    disabled?: boolean;
}

export default function UserSelect({ value, onChange, label, multiple = false, status, helperText, disabled }: UserSelectProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/users?limit=100').then(res => {
            if (res.data.success) {
                setUsers(res.data.data);
            }
        }).catch(err => {
            console.error('Failed to fetch users:', err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <div>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>{label}</Text>
            <Select
                value={value}
                mode={multiple ? 'multiple' : undefined}
                onChange={onChange}
                disabled={disabled || loading}
                status={status}
                style={{ width: '100%' }}
                placeholder={`Select ${label}`}
                loading={loading}
                optionLabelProp="label"
                filterOption={(input, option) =>
                    (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
            >
                {users.map((user) => (
                    <Select.Option key={user._id} value={user._id} label={user.name}>
                        <Space>
                            <Avatar size="small" src={user.avatar}>
                                {user.name.charAt(0)}
                            </Avatar>
                            <div>
                                <Text strong style={{ display: 'block', fontSize: 13, lineHeight: 1 }}>{user.name}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{user.email}</Text>
                            </div>
                        </Space>
                    </Select.Option>
                ))}
            </Select>
            {helperText && <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{helperText}</Text>}
        </div>
    );
}
