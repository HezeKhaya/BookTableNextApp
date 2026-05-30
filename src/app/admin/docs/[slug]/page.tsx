import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import MarkdownRenderer from '@/components/admin/MarkdownRenderer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Admin Documentation - Book Table',
};

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // Security check: ensure slug only contains alphanumeric characters, dashes, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        notFound();
    }

    const filePath = path.join(process.cwd(), 'src', 'docs', 'BookTable', `${slug}.md`);
    let content = '';
    
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        notFound();
    }

    return (
        <main>
            <Header showSearch={false} />
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
                <Link href="/admin/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', textDecoration: 'none', marginBottom: '2rem' }}>
                    <ArrowLeft size={16} /> Back to Docs Home
                </Link>
                <MarkdownRenderer content={content} />
            </div>
        </main>
    );
}
