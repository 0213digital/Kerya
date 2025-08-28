import React from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() { 
    const { t } = useTranslation(); 
    return (
        <footer className="bg-white border-t border-slate-200 mt-16">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} {t('appName')}. {t('footerRights')}</p>
                </div>
            </div>
        </footer>
    );
}