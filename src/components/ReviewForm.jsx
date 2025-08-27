import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function ReviewForm({ booking, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { session } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (rating === 0) {
      setError('Please select a rating.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('reviews').insert({
      user_id: session.user.id,
      vehicle_id: booking.vehicle_id,
      booking_id: booking.id,
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
        onReviewSubmitted();
      }
      setTimeout(() => onClose(), 2000); // Close modal after 2s
    }
    setSubmitting(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
        <div className="relative p-6 bg-white rounded-lg shadow-xl w-full max-w-md">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">&times;</button>
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
                disabled={submitting}
                className="bg-indigo-600 text-white py-2 px-5 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
                {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {success && <p className="text-green-500 mt-2">{success}</p>}
            </form>
        </div>
    </div>
  );
}