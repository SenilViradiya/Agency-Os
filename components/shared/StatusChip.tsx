import { Tag } from 'antd';
import { 
    CheckCircleOutlined, 
    SyncOutlined, 
    CloseCircleOutlined, 
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    MinusCircleOutlined 
} from '@ant-design/icons';

interface StatusChipProps {
    status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
    const getTagProps = () => {
        const s = status.toLowerCase();
        switch (s) {
            case 'active':
            case 'won':
            case 'completed':
            case 'qualified':
                return { color: 'success', icon: <CheckCircleOutlined /> };
            case 'inactive':
            case 'lost':
            case 'cancelled':
            case 'churned':
                return { color: 'error', icon: <CloseCircleOutlined /> };
            case 'suspended':
            case 'on_hold':
            case 'negotiation':
                return { color: 'warning', icon: <ExclamationCircleOutlined /> };
            case 'new':
            case 'planning':
            case 'proposal_sent':
            case 'contacted':
                return { color: 'processing', icon: <SyncOutlined spin /> };
            default:
                return { color: 'default', icon: <MinusCircleOutlined /> };
        }
    };

    const { color, icon } = getTagProps();
    const label = status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <Tag icon={icon} color={color} style={{ fontWeight: 600, borderRadius: '4px' }}>
            {label}
        </Tag>
    );
}
