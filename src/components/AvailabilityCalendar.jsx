import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const isBetween = (date, start, end) => date >= start && date <= end;

export function AvailabilityCalendar({ vehicleId, onDateChange }) {
    const { t } = useTranslation();
    const [unavailableDates, setUnavailableDates] = useState(new Set());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [hoverDate, setHoverDate] = useState(null);

    // Utiliser useCallback pour stabiliser la fonction de fetch
    const fetchUnavailableDates = useCallback(async () => {
        if (!vehicleId) return;
        const { data, error } = await supabase.rpc('get_unavailable_dates', { p_vehicle_id: vehicleId });
        if (error) {
            console.error("Error fetching unavailable dates:", error);
        } else {
            setUnavailableDates(new Set(data.map(d => d.unavailable_date)));
        }
    }, [vehicleId]);

    useEffect(() => {
        fetchUnavailableDates();
    }, [fetchUnavailableDates]);

    const handleDateClick = (day) => {
        if (unavailableDates.has(day.toISOString().split('T')[0])) return;

        let newStart = startDate;
        let newEnd = endDate;

        if (!startDate || (startDate && endDate)) {
            newStart = day;
            newEnd = null;
        } else if (day > startDate) {
            newEnd = day;
        } else {
            newStart = day;
        }

        setStartDate(newStart);
        setEndDate(newEnd);
        onDateChange(newEnd, newStart);
    };
    
    const renderDays = () => {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            const dayString = day.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dayString;
            const isPast = day < new Date(new Date().setDate(new Date().getDate() -1));
            const isUnavailable = unavailableDates.has(dayString) || isPast;
            
            const isStartDate = startDate && day.getTime() === startDate.getTime();
            const isEndDate = endDate && day.getTime() === endDate.getTime();
            const isHovering = hoverDate && startDate && !endDate && isBetween(day, startDate, hoverDate);
            const inRange = startDate && endDate && isBetween(day, startDate, endDate);
            
            let cx = "w-10 h-10 flex items-center justify-center rounded-full transition-colors";
            if (isUnavailable) {
                 cx += " text-slate-400 line-through cursor-not-allowed";
            } else {
                 cx += " cursor-pointer hover:bg-indigo-100";
            }
            if(isToday && !isStartDate && !isEndDate && !inRange) cx += " border border-indigo-500"
            if(isStartDate || isEndDate) cx += " bg-indigo-600 text-white";
            if(inRange) cx += " bg-indigo-200 text-indigo-800 rounded-none";
            if(isHovering) cx += " bg-indigo-200";

            days.push(
                <div key={dayString} onClick={() => !isUnavailable && handleDateClick(day)} onMouseEnter={() => !isUnavailable && setHoverDate(day)} className={cx}>
                    {i}
                </div>
            );
        }
        return days;
    };

    const monthName = t('monthNames')[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();

    return (
        <div className="p-4 bg-white rounded-lg" onMouseLeave={() => setHoverDate(null)}>
             <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeft size={20} /></button>
                <h3 className="font-semibold text-lg">{`${monthName} ${year}`}</h3>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {t('dayNamesShort').map(day => <div key={day} className="font-semibold text-slate-500">{day}</div>)}
                {renderDays()}
            </div>
        </div>
    );
}