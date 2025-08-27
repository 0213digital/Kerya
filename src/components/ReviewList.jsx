import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';

function StarRating({ rating }) {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.363 2.44a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.363-2.44a1 1 0 00-1.175 0l-3.363 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewList({ vehicleId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!vehicleId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profiles (
            full_name
          )
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
      } else {
        setReviews(data);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [vehicleId]);

  if (loading) return <p>Loading reviews...</p>;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4">
        {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
      </h3>
      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first to leave one!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center mb-2">
                <div className="font-semibold">{review.profiles?.full_name || 'Anonymous'}</div>
                <div className="ml-auto text-sm text-gray-500">
                  {format(new Date(review.created_at), 'MMMM d, yyyy')}
                </div>
              </div>
              <StarRating rating={review.rating} />
              <p className="mt-2 text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}