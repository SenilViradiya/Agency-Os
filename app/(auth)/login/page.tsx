'use client';

import { Flex } from 'antd';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <Flex
            align="center"
            justify="center"
            style={{
                backgroundColor: '#f5f5f5',
                minHeight: '100vh',
            }}
        >
            <div style={{ width: '100%', maxWidth: 450, padding: 24 }}>
                <LoginForm />
            </div>
        </Flex>
    );
}
