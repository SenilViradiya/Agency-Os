import { Chip } from '@mui/material';

interface StatusChipProps {
    status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
    const getColor = () => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'won':
            case 'completed':
            case 'qualified':
                return 'success';
            case 'inactive':
            case 'lost':
            case 'cancelled':
            case 'churned':
                return 'error';
            case 'suspended':
            case 'on_hold':
            case 'negotiation':
                return 'warning';
            case 'new':
            case 'planning':
            case 'proposal_sent':
            case 'contacted':
                return 'primary';
            default:
                return 'default';
        }
    };

    const label = status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <Chip
            label={label}
            color={getColor() as any}
            size="small"
            sx={{ fontWeight: 600, borderRadius: '6px' }}
        />
    );
}

