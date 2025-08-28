import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Composant pour le calendrier
const AgencyCalendar = ({ bookings, vehicles }) => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const vehicleColors = useMemo(() => {
        const colors = ['bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200'];
        const colorMap = new Map();
        vehicles.forEach((vehicle, index) => {
            colorMap.set(vehicle.id, colors[index % colors.length]);
        });
        return colorMap;
    }, [vehicles]);

    const renderHeader = () => (
        <div className="flex justify-between items-center mb-4 px-4 py-2">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeft size={24} /></button>
            <h2 className="text-xl font-bold">{currentMonth.toLocaleString(t('locale'), { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={24} /></button>
        </div>
    );

    const renderDays = () => (
        <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-600">
            {t('dayNamesShort').map(day => <div key={day} className="py-2 border-b">{day}</div>)}
        </div>
    );

    const renderCells = () => {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - monthStart.getDay());
        const endDate = new Date(monthEnd);
        endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
        
        const rows = [];
        let days = [];
        let day = new Date(startDate);

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(day);
                const dayBookings = bookings.filter(b => {
                    const bookingStart = new Date(b.start_date);
                    const bookingEnd = new Date(b.end_date);
                    bookingStart.setHours(0,0,0,0);
                    bookingEnd.setHours(0,0,0,0);
                    return currentDate >= bookingStart && currentDate <= bookingEnd;
                });

                days.push(
                    <div key={day} className={`border-t border-r p-2 min-h-[120px] ${day.getMonth() !== currentMonth.getMonth() ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}>
                        <div className="font-medium">{day.getDate()}</div>
                        <div className="mt-1 space-y-1">
                            {dayBookings.map(b => (
                                <div key={b.id} className={`text-xs p-1 rounded truncate ${vehicleColors.get(b.vehicle_id) || 'bg-gray-200'}`}>
                                    {b.vehicles.make} {b.vehicles.model}
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day.setDate(day.getDate() + 1);
            }
            rows.push(<div key={day} className="grid grid-cols-7">{days}</div>);
            days = [];
        }
        return <div className="border-l border-b">{rows}</div>;
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};


// Page principale
export function AgencyCalendarPage() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        
        const { data: agencyData } = await supabase.from('agencies').select('id').eq('owner_id', profile.id).single();
        if (!agencyData) {
            setLoading(false);
            return;
        }

        const { data: vehicleData } = await supabase.from('vehicles').select('id, make, model').eq('agency_id', agencyData.id);
        if (vehicleData) {
            setVehicles(vehicleData);
            const vehicleIds = vehicleData.map(v => v.id);
            const { data: bookingData } = await supabase
                .from('bookings')
                .select('id, start_date, end_date, vehicle_id, vehicles(make, model)')
                .in('vehicle_id', vehicleIds)
                .in('status', ['confirmed', 'picked-up']); // On affiche seulement les réservations actives
            setBookings(bookingData || []);
        }
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <DashboardLayout title={t('agencyCalendar')} description={t('agencyCalendarDesc')}>
            {loading ? <p>{t('loading')}...</p> : <AgencyCalendar bookings={bookings} vehicles={vehicles} />}
        </DashboardLayout>
    );
}