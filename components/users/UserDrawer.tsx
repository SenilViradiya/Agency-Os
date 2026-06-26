'use client';

import {
    Drawer,
    Button,
    Space,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import UserForm from './UserForm';

interface UserDrawerProps {
    open: boolean;
    onClose: () => void;
    initialData?: any;
    roles: any[];
    onSubmit: (data: any) => void;
    loading: boolean;
}

export default function UserDrawer({
    open,
    onClose,
    initialData,
    roles,
    onSubmit,
    loading,
}: UserDrawerProps) {
    const isEdit = !!initialData;

    return (
        <Drawer
            title={isEdit ? 'Edit User' : 'Add New User'}
            placement="right"
            onClose={onClose}
            open={open}
            size="default"
            extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
        >
            <div style={{ padding: '0 24px' }}>
                <UserForm
                    initialData={initialData}
                    roles={roles}
                    onSubmit={onSubmit}
                    loading={loading}
                    isEdit={isEdit}
                />
            </div>
        </Drawer>
    );
}
