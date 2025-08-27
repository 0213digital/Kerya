import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';

const VehicleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for handling the booking process
  const [booking, setBooking] = useState({ startDate: null, endDate: null });
  const [isBooking, setIsBooking] = useState(false); // To show loading state on the button
  const [bookingError, setBookingError] = useState(''); // To display availability errors

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            *,
            agencies (
              name,
              address,
              contact_info
            ),
            reviews (
              *,
              profiles (
                full_name
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setVehicle(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id]);

  // Callback for when the user selects a date range in the calendar
  const handleDateChange = ({ startDate, endDate }) => {
    setBooking({ startDate, endDate });
    setBookingError(''); // Clear any previous error when new dates are selected
  };

  // **FIX:** This function now checks for availability before navigating.
  const handleBooking = async () => {
    // 1. Validate that dates have been selected
    if (!booking.startDate || !booking.endDate) {
      setBookingError('Please select a start and end date from the calendar.');
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      // 2. Perform a final availability check against the database
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', id)
        .eq('status', 'confirmed')
        // Check for any bookings that overlap with the selected range
        .lte('start_date', booking.endDate.toISOString().slice(0, 10))
        .gte('end_date', booking.startDate.toISOString().slice(0, 10));

      if (error) throw error;

      // If we find any bookings (data.length > 0), the dates are taken
      if (data && data.length > 0) {
        setBookingError('Sorry, these dates are no longer available. Please select a different date range.');
      } else {
        // 3. If no overlap is found, it's safe to proceed to the booking page
        navigate('/booking', { state: { vehicle, booking } });
      }
    } catch (err) {
      setBookingError('Could not verify availability. Please try again.');
      console.error('Error checking booking availability:', err);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) return <p>Loading vehicle details...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!vehicle) return <p>Vehicle not found.</p>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <img src={vehicle.image_urls?.[0] || 'https://placehold.co/600x400'} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-auto object-cover rounded-lg shadow-lg mb-4" />
            <h1 className="text-4xl font-bold">{vehicle.make} {vehicle.model} ({vehicle.year})</h1>
            <p className="text-xl text-gray-700">{vehicle.agencies.name}</p>
            <p className="text-md text-gray-500 mb-4">{vehicle.agencies.address}</p>
            
            <div className="my-6">
              <h2 className="text-2xl font-semibold mb-2">Features</h2>
              <ul className="list-disc list-inside grid grid-cols-2 gap-2">
                {vehicle.features && Object.entries(vehicle.features).map(([key, value]) => (
                  value && <li key={key}>{key.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
            
            <div className="my-6">
                <h2 className="text-2xl font-semibold mb-2">Reviews</h2>
                <ReviewList reviews={vehicle.reviews} />
                <ReviewForm vehicleId={vehicle.id} />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white p-6 rounded-lg shadow-md">
              <p className="text-3xl font-bold mb-4">
                ${vehicle.price_per_day} <span className="text-lg font-normal">/ day</span>
              </p>
              <h3 className="text-xl font-semibold mb-2">Select Dates</h3>
              <AvailabilityCalendar vehicleId={id} onDateChange={handleDateChange} />
              
              {/* Display booking error message here */}
              {bookingError && <p className="text-red-500 text-sm my-2">{bookingError}</p>}
              
              <button
                onClick={handleBooking}
                disabled={isBooking}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
              >
                {isBooking ? 'Checking...' : 'Reserve'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VehicleDetailsPage;
