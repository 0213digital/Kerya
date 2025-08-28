import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import 'leaflet/dist/leaflet.css';

export function InteractiveMap({ vehicles }) {
    const { t } = useTranslation();

    const defaultPosition = [36.776, 3.058];

    const firstVehicleWithCoords = vehicles.find(v => v.agencies && v.agencies.latitude && v.agencies.longitude);
    const mapCenter = firstVehicleWithCoords 
        ? [firstVehicleWithCoords.agencies.latitude, firstVehicleWithCoords.agencies.longitude]
        : defaultPosition;

    return (
        <MapContainer key={mapCenter.toString()} center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {vehicles.map(vehicle => {
                if (vehicle.agencies && typeof vehicle.agencies.latitude === 'number' && typeof vehicle.agencies.longitude === 'number') {
                    return (
                        <Marker key={vehicle.id} position={[vehicle.agencies.latitude, vehicle.agencies.longitude]}>
                            <Popup>
                                <div className="w-48">
                                    <img 
                                        src={vehicle.image_urls?.[0] || `https://placehold.co/600x400/e2e8f0/64748b?text=Image`} 
                                        alt={vehicle.model} 
                                        className="w-full h-24 object-cover rounded-md mb-2"
                                    />
                                    <h3 className="font-bold">{vehicle.make} {vehicle.model}</h3>
                                    <p className="text-sm text-slate-500">{vehicle.agencies.agency_name}</p>
                                    <p className="font-semibold">{vehicle.daily_rate_dzd.toLocaleString()} {t('dailyRateSuffix')}</p>
                                    <Link to={`/vehicle/${vehicle.id}`} className="text-indigo-600 hover:underline text-sm font-semibold">
                                        {t('viewDetails')}
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }
                return null;
            })}
        </MapContainer>
    );
}