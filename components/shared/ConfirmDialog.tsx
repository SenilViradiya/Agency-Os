import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />
                    <span>{title}</span>
                </div>
            }
            open={open}
            onOk={onConfirm}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="Confirm"
            okButtonProps={{ danger: true, size: 'large' }}
            cancelButtonProps={{ size: 'large' }}
        >
            <p style={{ fontSize: 16, margin: '16px 0' }}>{message}</p>
        </Modal>
    );
}
