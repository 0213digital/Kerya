import React from 'react';

export const MonthlyRevenueChart = ({ data, t }) => {
    const maxValue = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h3 className="text-lg font-semibold mb-4">{t('monthlyRevenue')}</h3>
            <div className="flex justify-around items-end h-64 space-x-2">
                {data.map((monthData) => (
                    <div key={monthData.month} className="flex flex-col items-center flex-1 h-full">
                        <div className="w-full h-full flex items-end">
                             <div
                                className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t-md"
                                style={{ height: `${(monthData.revenue / maxValue) * 100}%` }}
                                title={`${t('revenue')}: ${monthData.revenue.toLocaleString()} DZD`}
                            ></div>
                        </div>
                        <span className="text-xs mt-2 text-slate-500">{monthData.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};