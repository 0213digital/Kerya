import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function ReviewForm({ vehicleId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkUserAndBooking = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // Check if the user has a COMPLETED booking for this vehicle
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('user_id', session.user.id)
        .eq('vehicle_id', vehicleId)
        .eq('status', 'completed');

      if (bookingError) {
        console.error("Error checking bookings:", bookingError);
        setLoading(false);
        return;
      }

      if (bookings && bookings.length > 0) {
        // Now check if the user has already reviewed one of these completed bookings
        const bookingIds = bookings.map(b => b.id);
        const { data: reviews, error: reviewError } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', session.user.id)
          .in('booking_id', bookingIds);
        
        if (reviewError) {
            console.error("Error checking reviews:", reviewError);
        } else if (reviews.length < bookings.length) {
            // User has at least one completed booking they haven't reviewed yet
            setCanReview(true);
        }
      }
      setLoading(false);
    };

    checkUserAndBooking();
  }, [vehicleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    // Find a completed booking that hasn't been reviewed yet
    const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicleId)
        .eq('status', 'completed')
        .limit(1) // Just need one eligible booking
        .single();
    
    if (!booking) {
        setError("Could not find an eligible booking to review.");
        return;
    }

    const { error: insertError } = await supabase.from('reviews').insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      booking_id: booking.id, // Link the review to the booking
      rating,
      comment,
    });

    if (insertError) {
      console.error('Error submitting review:', insertError);
      setError(insertError.message.includes('unique_user_booking_review') 
        ? 'You have already submitted a review for this booking.'
        : 'Failed to submit review. Please try again.');
    } else {
      setSuccess('Thank you for your review!');
      setRating(0);
      setComment('');
      if (onReviewSubmitted) {
        onReviewSubmitted(); // To refresh the review list
      }
    }
  };

  if (loading) return null; // Don't show anything while checking eligibility
  if (!user) return <p>You must be logged in to leave a review.</p>;
  if (!canReview) return <p>You can only review vehicles after a completed trip.</p>;

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-2xl font-bold mb-4">Leave a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Your Rating</label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.363 2.44a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.363-2.44a1 1 0 00-1.175 0l-3.363 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="comment" className="block mb-2 font-semibold">Your Comment</label>
          <textarea
            id="comment"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Share your experience..."
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700"
        >
          Submit Review
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
      </form>
    </div>
  );
}

export default ReviewForm;
