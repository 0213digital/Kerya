import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';
import { Star, X } from 'lucide-react';

// Un composant réutilisable pour une ligne de notation par étoiles
const StarRatingInput = ({ label, rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className="cursor-pointer"
                        size={28}
                        fill={star <= (hoverRating || rating) ? '#f59e0b' : 'none'}
                        color={star <= (hoverRating || rating) ? '#f59e0b' : '#d1d5db'}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                    />
                ))}
            </div>
        </div>
    );
};

export function ReviewForm({ booking, onClose, onReviewSubmitted }) {
    const { t } = useTranslation();
    
    // State pour chaque critère de notation
    const [vehicleRating, setVehicleRating] = useState(0);
    const [serviceRating, setServiceRating] = useState(0);
    const [cleanlinessRating, setCleanlinessRating] = useState(0);
    const [punctualityRating, setPunctualityRating] = useState(0);

    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (vehicleRating === 0 || serviceRating === 0 || cleanlinessRating === 0 || punctualityRating === 0) {
            setError(t('selectARating'));
            return;
        }
        setLoading(true);
        setError('');

        const { error: insertError } = await supabase.from('reviews').insert({
            booking_id: booking.id,
            vehicle_id: booking.vehicles.id,
            agency_id: booking.vehicles.agencies.id, // Ajout de l'ID de l'agence
            user_id: booking.user_id,
            vehicle_rating: vehicleRating,
            service_rating: serviceRating,
            cleanliness_rating: cleanlinessRating,
            punctuality_rating: punctualityRating,
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{t('reviewFormTitle')}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Section pour la note du véhicule */}
                    <div>
                        <h4 className="text-md font-semibold mb-2">{t('vehicleRating')}</h4>
                        <StarRatingInput label={booking.vehicles.make + ' ' + booking.vehicles.model} rating={vehicleRating} setRating={setVehicleRating} />
                    </div>

                    {/* Section pour la note de l'agence */}
                    <div>
                        <h4 className="text-md font-semibold mb-2">{t('agencyRating')}</h4>
                        <div className="space-y-4">
                           <StarRatingInput label={t('service')} rating={serviceRating} setRating={setServiceRating} />
                           <StarRatingInput label={t('cleanliness')} rating={cleanlinessRating} setRating={setCleanlinessRating} />
                           <StarRatingInput label={t('punctuality')} rating={punctualityRating} setRating={setPunctualityRating} />
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
