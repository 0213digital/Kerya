import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Wind, Droplets } from 'lucide-react';

export function VehicleCard({ vehicle }) {
    const { t } = useTranslation();
    const transmissionText = vehicle.transmission === 'manual' ? t('manual') : t('automatic');
    const fuelText = vehicle.fuel_type === 'gasoline' ? t('gasoline') : t('diesel');
    const imageUrl = vehicle.image_urls && vehicle.image_urls.length > 0 ? vehicle.image_urls[0] : `https://placehold.co/600x400/e2e8f0/64748b?text=${vehicle.make}+${vehicle.model}`;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <Link to={`/vehicle/${vehicle.id}`}>
                <img src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-48 object-cover" />
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">{vehicle.make}</p>
                            <h3 className="text-lg font-bold text-slate-800">{vehicle.model}</h3>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-sm text-slate-600">
                        <div className="flex items-center"><Users size={16} className="mr-1" /> {vehicle.seats} {t('seats')}</div>
                        <div className="flex items-center capitalize"><Wind size={16} className="mr-1" /> {transmissionText}</div>
                        <div className="flex items-center capitalize"><Droplets size={16} className="mr-1" /> {fuelText}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                        <p className="text-xl font-bold text-indigo-600">{vehicle.daily_rate_dzd} <span className="text-sm font-normal text-slate-500">{t('dailyRateSuffix')}</span></p>
                        <span className={`px-4 py-2 text-sm font-medium rounded-md ${vehicle.is_available ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{vehicle.is_available ? t('bookNow') : t('unavailable')}</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
