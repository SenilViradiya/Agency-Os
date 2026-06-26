'use client';

import { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { SessionProvider } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [open, setOpen] = useState(!isMobile);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <SessionProvider>
            <Box sx={{ display: 'flex' }}>
                <Sidebar open={open} toggleDrawer={toggleDrawer} />
                <Topbar toggleDrawer={toggleDrawer} />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, md: 4 },
                        width: { sm: `calc(100% - ${open ? 260 : 70}px)` },
                        mt: { xs: 8, md: 0 },
                        backgroundColor: 'background.default',
                        minHeight: '100vh',
                        transition: 'width 0.3s, margin-left 0.3s',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </SessionProvider>
    );
}
