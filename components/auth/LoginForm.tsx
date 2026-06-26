'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Form,
    Input,
    Button,
    Typography,
    Alert,
    Flex
} from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        setError(null);

        try {
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            style={{
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: 'none'
            }}
            styles={{ body: { padding: '40px' } }}
        >
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#6C63FF' }}>
                    AgencyOS
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                    Sign in to manage your agency
                </Text>
            </div>

            {error && (
                <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 8 }}
                />
            )}

            <Form
                layout="vertical"
                onFinish={onFinish}
                size="large"
                requiredMark={false}
            >
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Invalid email address' }
                    ]}
                >
                    <Input
                        prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Email Address"
                        style={{ borderRadius: 8, height: 50 }}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                    style={{ marginBottom: 32 }}
                >
                    <Input.Password
                        prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Password"
                        style={{ borderRadius: 8, height: 50 }}
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        style={{
                            height: 50,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 16,
                            backgroundColor: '#6C63FF'
                        }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}
