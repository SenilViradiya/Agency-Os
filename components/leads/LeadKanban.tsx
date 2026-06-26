'use client';

import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box, Typography, Badge, Paper, Stack } from '@mui/material';
import LeadCard from './LeadCard';

const COLUMNS = [
    { id: 'new', title: 'New' },
    { id: 'contacted', title: 'Contacted' },
    { id: 'qualified', title: 'Qualified' },
    { id: 'proposal_sent', title: 'Proposal Sent' },
    { id: 'negotiation', title: 'Negotiation' },
    { id: 'won', title: 'Won' },
    { id: 'lost', title: 'Lost' },
];

interface LeadKanbanProps {
    leads: any[];
    onStatusChange: (leadId: string, newStatus: string) => void;
    onCardClick: (lead: any) => void;
}

export default function LeadKanban({ leads, onStatusChange, onCardClick }: LeadKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const groupedLeads = useMemo(() => {
        return COLUMNS.reduce((acc: any, col) => {
            acc[col.id] = leads.filter(l => l.status === col.id);
            return acc;
        }, {});
    }, [leads]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const leadId = active.id as string;
        const overId = over.id as string;

        // Find which column the lead was dropped into
        const newStatus = COLUMNS.find(c => c.id === overId)?.id ||
            leads.find(l => l._id === overId)?.status;

        if (newStatus && newStatus !== leads.find(l => l._id === leadId)?.status) {
            onStatusChange(leadId, newStatus);
        }

        setActiveId(null);
    };

    const activeLead = useMemo(() =>
        leads.find(l => l._id === activeId),
        [leads, activeId]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Box sx={{
                display: 'flex',
                gap: 2,
                pb: 2,
                overflowX: 'auto',
                minHeight: 'calc(100vh - 250px)',
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 4 }
            }}>
                {COLUMNS.map((column) => (
                    <Box key={column.id} sx={{ minWidth: 280, width: 280 }}>
                        <Paper
                            sx={{
                                p: 2,
                                bgcolor: 'grey.50',
                                borderRadius: 3,
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'grey.200',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.75rem' }}>
                                        {column.title}
                                    </Typography>
                                    <Badge
                                        badgeContent={groupedLeads[column.id].length}
                                        color="primary"
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                position: 'static',
                                                transform: 'none',
                                                fontSize: '0.65rem',
                                                height: 18,
                                                minWidth: 18,
                                                fontWeight: 800
                                            }
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    ₹{groupedLeads[column.id].reduce((sum: number, l: any) => sum + (l.budget || 0), 0).toLocaleString('en-IN')}
                                </Typography>
                            </Box>

                            <SortableContext
                                id={column.id}
                                items={groupedLeads[column.id].map((l: any) => l._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <Box sx={{ minHeight: 100 }}>
                                    {groupedLeads[column.id].map((lead: any) => (
                                        <LeadCard
                                            key={lead._id}
                                            lead={lead}
                                            onClick={onCardClick}
                                        />
                                    ))}
                                </Box>
                            </SortableContext>
                        </Paper>
                    </Box>
                ))}
            </Box>

            <DragOverlay>
                {activeLead ? (
                    <LeadCard lead={activeLead} onClick={() => { }} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
