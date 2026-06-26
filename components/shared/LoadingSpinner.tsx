import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
            <CircularProgress size={40} thickness={4} />
        </Box>
    );
}
