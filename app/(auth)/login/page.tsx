import { Box, Container } from '@mui/material';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <Box
            sx={{
                backgroundColor: 'background.default',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Container maxWidth="sm">
                <LoginForm />
            </Container>
        </Box>
    );
}
