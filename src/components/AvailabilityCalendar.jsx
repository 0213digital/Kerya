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
    // FIX: Add a guard clause to prevent running with an undefined vehicleId.
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    const fetchUnavailabilities = async () => {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_unavailable_dates_for_vehicle', {
        p_vehicle_id: vehicleId
      });

      if (rpcError) {
        console.error('Error fetching unavailable dates:', rpcError);
        setError('Failed to load availability.');
      } else {
        setUnavailableDates(data || []);
      }
      setLoading(false);
    };

    fetchUnavailabilities();
  }, [vehicleId]); // Dependency array is correct

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
      if (!interval || !interval.start_date || !interval.end_date) return false;
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
        onChange={(value) => onDateChange(value[0], value[1])}
        selectRange={true}
        tileDisabled={isDateDisabled}
        className="w-full border-0"
      />
    </div>
  );
}