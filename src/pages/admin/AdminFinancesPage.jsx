import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Banknote, TrendingUp, TrendingDown, Clock } from 'lucide-react';

// Helper component for stat cards
const StatCard = ({ title, value, icon, isLoading }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        {icon}
        <div>
            <h3 className="text-slate-500">{title}</h3>
            {isLoading ? (
                <div className="h-8 bg-slate-200 rounded w-24 mt-2 animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold mt-2">{value}</p>
            )}
        </div>
    </div>
);

export function AdminFinancesPage() {
    // Corrected the query to select 'price' instead of 'total_price'
    const { data: totalRevenue, isLoading: isTotalRevenueLoading } = useQuery({
        queryKey: ['totalRevenue'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select('price') // CORRECTED: Changed 'total_price' to 'price'
                .eq('status', 'returned');
            if (error) throw new Error(error.message);
            return data.reduce((acc, booking) => acc + (booking.price || 0), 0);
        },
    });

    // This query is just an example and might need adjustment based on your data
    const { data: pendingPayouts, isLoading: isPendingPayoutsLoading } = useQuery({
        queryKey: ['pendingPayouts'],
        queryFn: async () => {
            // This is a placeholder logic. You'll need a way to track payouts.
            const { data, error } = await supabase
                .from('bookings')
                .select('price') // CORRECTED: Changed 'total_price' to 'price'
                .in('status', ['confirmed', 'picked-up']);
            if (error) throw new Error(error.message);
            const total = data.reduce((acc, booking) => acc + (booking.price || 0), 0);
            return total * 0.90; // Assuming 90% goes to agency
        },
    });
    
    const platformCommission = totalRevenue ? totalRevenue * 0.10 : 0;

    return (
        <DashboardLayout title="Finance Overview" description="Monitor platform revenue and payouts.">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Revenue (Completed)" 
                    value={`${(totalRevenue || 0).toLocaleString()} DZD`}
                    icon={<Banknote size={32} className="text-green-500 mr-4" />}
                    isLoading={isTotalRevenueLoading}
                />
                <StatCard 
                    title="Platform Commission (10%)" 
                    value={`${platformCommission.toLocaleString()} DZD`}
                    icon={<TrendingUp size={32} className="text-indigo-500 mr-4" />}
                    isLoading={isTotalRevenueLoading}
                />
                <StatCard 
                    title="Pending Payouts to Agencies" 
                    value={`${(pendingPayouts || 0).toLocaleString()} DZD`}
                    icon={<Clock size={32} className="text-amber-500 mr-4" />}
                    isLoading={isPendingPayoutsLoading}
                />
            </div>
            {/* You can add more detailed tables or charts for transactions below */}
        </DashboardLayout>
    );
}

// NOTE: Since this file uses a named export, we don't add 'default'
// export default AdminFinancesPage; 
