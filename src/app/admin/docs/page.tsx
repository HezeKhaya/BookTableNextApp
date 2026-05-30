import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import MarkdownRenderer from '@/components/admin/MarkdownRenderer';

export const metadata = {
    title: 'Admin Documentation - Book Table',
};

export default async function AdminDocsIndex() {
    const filePath = path.join(process.cwd(), 'src', 'docs', 'BookTable', 'Admin-Home.md');
    let content = 'Documentation not found.';
    
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        console.error('Failed to load Admin-Home.md', e);
    }

    return (
        <main>
            <Header showSearch={false} />
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
                <MarkdownRenderer content={content} />
            </div>
        </main>
    );
}
