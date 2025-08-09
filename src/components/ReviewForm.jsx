import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { Star, X } from 'lucide-react';

export function ReviewForm({ booking, onClose, onReviewSubmitted }) {
    const { t } = useTranslation();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError(t('selectARating'));
            return;
        }
        setLoading(true);
        setError('');

        const { error: insertError } = await supabase.from('reviews').insert({
            booking_id: booking.id,
            vehicle_id: booking.vehicles.id, // Corrected from booking.vehicle_id
            user_id: booking.user_id,
            rating: rating,
            comment: comment,
        });

        if (insertError) {
            setError(insertError.message);
        } else {
            onReviewSubmitted();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t('reviewFormTitle')}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('yourRating')}</label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    className="cursor-pointer"
                                    size={32}
                                    color={star <= (hoverRating || rating) ? '#f59e0b' : '#d1d5db'}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium">{t('yourCommentOptional')}</label>
                        <textarea
                            id="comment"
                            rows="4"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-md"
                            placeholder={t('howWasYourExperience')}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-100 hover:bg-slate-200">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                            {loading ? t('processing') : t('submitReview')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
