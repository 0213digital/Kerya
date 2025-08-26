import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../lib/supabaseClient';
import { isWithinInterval, parseISO } from 'date-fns';

function AvailabilityCalendar({ vehicleId }) {
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchUnavailabilities = async () => {
      setLoading(true);
      setError(null);
      
      // Fetch both confirmed bookings and manual unavailabilities
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

  // Function to check if a date should be disabled
  const isDateDisabled = ({ date, view }) => {
    if (view !== 'month') {
      return false;
    }

    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
        return true;
    }

    // Check if the date falls within any unavailable interval
    return unavailableDates.some(interval => {
      // Supabase returns dates as strings, so we parse them.
      // The end_date is inclusive, so we don't need to add a day.
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
        tileDisabled={isDateDisabled}
        className="w-full border-0"
      />
    </div>
  );
}

export default AvailabilityCalendar;
