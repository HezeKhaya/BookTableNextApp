'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidChart from './MermaidChart';
import Link from 'next/link';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className={styles.container}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isMermaid = match && match[1] === 'mermaid';

                        if (!inline && isMermaid) {
                            return (
                                <div className={styles.mermaidContainer}>
                                    <MermaidChart chart={String(children).replace(/\n$/, '')} />
                                </div>
                            );
                        }

                        return !inline ? (
                            <pre className={styles.codeBlock}>
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code className={styles.inlineCode} {...props}>
                                {children}
                            </code>
                        );
                    },
                    a({ href, children }) {
                        if (href?.startsWith('/')) {
                            return <Link href={href}>{children}</Link>;
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
