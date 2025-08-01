import React from 'react';

/**
 * A reusable layout component for dashboard pages.
 * It provides a consistent header with a title and description.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the layout.
 * @param {string} props.title - The main title for the page.
 * @param {string} props.description - The subtitle or description for the page.
 */
export function DashboardLayout({ children, title, description }) {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-slate-500 mt-1">{description}</p>
            </div>
            {children}
        </div>
    );
}
