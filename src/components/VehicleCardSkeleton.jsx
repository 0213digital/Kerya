import React from 'react';

export function VehicleCardSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-slate-200"></div>
            <div className="p-4">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-slate-300 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between items-center text-sm">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <div className="h-8 bg-slate-300 rounded w-1/3"></div>
                    <div className="h-10 bg-slate-200 rounded-md w-1/4"></div>
                </div>
            </div>
        </div>
    );
}
