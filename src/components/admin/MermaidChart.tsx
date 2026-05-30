'use client';

import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
    chart: string;
}

export default function MermaidChart({ chart }: MermaidChartProps) {
    const [svgCode, setSvgCode] = useState<string | null>(null);
    const [id] = useState(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });

        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(id, chart);
                setSvgCode(svg);
            } catch (error) {
                console.error("Mermaid parsing error:", error);
            }
        };
        
        renderChart();
    }, [chart, id]);

    if (!svgCode) {
        return <div style={{ color: '#64748b' }}>Loading diagram...</div>;
    }

    return (
        <div dangerouslySetInnerHTML={{ __html: svgCode }} />
    );
}
