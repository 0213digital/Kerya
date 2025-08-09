import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Star } from 'lucide-react';

const StarRating = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={i < rating ? 'text-amber-400 fill-current' : 'text-slate-300'} />
        ))}
    </div>
);

export function ReviewList({ vehicleId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!vehicleId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('reviews')
                .select('*, profiles(full_name, avatar_url)')
                .eq('vehicle_id', vehicleId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching reviews:", error);
            } else {
                setReviews(data);
            }
            setLoading(false);
        };
        fetchReviews();
    }, [vehicleId]);

    if (loading) return <p>Loading reviews...</p>;
    if (reviews.length === 0) return <p>No reviews yet for this vehicle.</p>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
            {reviews.map(review => (
                <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center mb-2">
                        <img 
                            src={review.profiles.avatar_url || `https://placehold.co/40x40/e2e8f0/64748b?text=${review.profiles.full_name?.[0] || 'U'}`} 
                            alt="avatar"
                            className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                        <div>
                            <p className="font-semibold">{review.profiles.full_name}</p>
                            <StarRating rating={review.rating} />
                        </div>
                    </div>
                    <p className="text-slate-600">{review.comment}</p>
                </div>
            ))}
        </div>
    );
}