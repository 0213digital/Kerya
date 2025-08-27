import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../lib/supabaseClient';
import { isWithinInterval, parseISO } from 'date-fns';

export function AvailabilityCalendar({ vehicleId, onDateChange }) {
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchUnavailabilities = async () => {
      setLoading(true);
      setError(null);
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'pending']);

      const { data: manualUnavailabilities, error: manualError } = await supabase
        .from('vehicle_unavailability')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId);

      if (bookingsError || manualError) {
        console.error('Error fetching dates:', bookingsError || manualError);
        setError('Failed to load availability.');
        setLoading(false);
        return;
      }
      
      const combinedUnavailabilities = [...(bookings || []), ...(manualUnavailabilities || [])];
      setUnavailableDates(combinedUnavailabilities);
      setLoading(false);
    };

    fetchUnavailabilities();
  }, [vehicleId]);

  const isDateDisabled = ({ date, view }) => {
    if (view !== 'month') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
        return true;
    }

    return unavailableDates.some(interval => {
      const start = parseISO(interval.start_date);
      const end = parseISO(interval.end_date);
      return isWithinInterval(date, { start, end });
    });
  };

  if (loading) return <p>Loading availability...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Vehicle Availability</h3>
      <Calendar
        onChange={(value) => onDateChange(value[1], value[0])}
        selectRange={true}
        tileDisabled={isDateDisabled}
        className="w-full border-0"
      />
    </div>
  );
}