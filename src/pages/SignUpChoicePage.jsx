import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { User, Briefcase } from 'lucide-react';

export function SignUpChoicePage() {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto max-w-4xl py-16 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-800">{t('chooseYourRole')}</h1>
                <p className="mt-2 text-lg text-slate-500">{t('chooseYourRoleDesc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Client Card */}
                <Link to="/signup/client" className="group block text-center bg-white p-8 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-center items-center h-24 w-24 rounded-full bg-indigo-100 mx-auto group-hover:bg-indigo-500 transition-colors">
                        <User className="h-12 w-12 text-indigo-600 group-hover:text-white" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-slate-800">{t('iAmAClient')}</h2>
                    <p className="mt-2 text-slate-500">{t('clientDescription')}</p>
                    <span className="mt-6 inline-block bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md group-hover:bg-indigo-700 transition-colors">
                        {t('getStartedAsClient')}
                    </span>
                </Link>

                {/* Agency Card */}
                <Link to="/signup/agency" className="group block text-center bg-white p-8 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-center items-center h-24 w-24 rounded-full bg-sky-100 mx-auto group-hover:bg-sky-500 transition-colors">
                        <Briefcase className="h-12 w-12 text-sky-600 group-hover:text-white" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-slate-800">{t('iAmAnAgency')}</h2>
                    <p className="mt-2 text-slate-500">{t('agencyDescription')}</p>
                    <span className="mt-6 inline-block bg-sky-600 text-white font-semibold py-2 px-6 rounded-md group-hover:bg-sky-700 transition-colors">
                        {t('getStartedAsAgency')}
                    </span>
                </Link>
            </div>
             <p className="text-center text-sm mt-12">
                {t('haveAccount')} <Link to="/login" className="text-indigo-600 hover:underline font-medium">{t('login')}</Link>
            </p>
        </div>
    );
}