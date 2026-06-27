'use client';

import { use } from 'react';
import ContentDetailView from '@/components/content/ContentDetailView';

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <ContentDetailView id={id} />
        </div>
    );
}
