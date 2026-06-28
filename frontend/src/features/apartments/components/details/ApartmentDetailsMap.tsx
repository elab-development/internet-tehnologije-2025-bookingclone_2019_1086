import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
} from "react-leaflet";

import type { ApartmentDetailsDto } from "../ApartmentDetailsPage";

import {
  buildAddressText,
  getMapCenter,
  getMapPosition,
  getMapZoom,
} from "./map/apartmentMapUtils";

type Props = {
  apartment: ApartmentDetailsDto;
};

const apartmentMarkerIcon = L.divIcon({
  className: "apartment-map-marker",
  html: '<span class="apartment-map-marker__dot"></span>',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -20],
});

export default function ApartmentDetailsMap({ apartment }: Props) {
  const { t } = useTranslation();

  const position = useMemo(() => {
    return getMapPosition(apartment);
  }, [apartment]);

  const mapCenter = useMemo(() => {
    return getMapCenter(position);
  }, [position]);

  const addressText = useMemo(() => {
    return buildAddressText(apartment);
  }, [apartment]);

  const zoom = getMapZoom(position);

  function getMapDescription() {
    if (position.hasExactCoordinates) {
      return t("apartments.details.map.coordinates", {
        latitude: apartment.latitude,
        longitude: apartment.longitude,
      });
    }

    return t("apartments.details.map.approximateLocation");
  }

  return (
    <section className="apartment-details-section apartment-details-section--map">
      <div className="apartment-map-header">
        <div>
          <h2 className="apartment-details-section__title apartment-map-header__title">
            {t("apartments.details.map.title")}
          </h2>

          <p className="apartment-map-header__address">{addressText}</p>
        </div>
      </div>

      <div className="apartment-map apartment-map--leaflet">
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}-${zoom}`}
          center={mapCenter}
          zoom={zoom}
          minZoom={3}
          maxZoom={19}
          scrollWheelZoom
          zoomControl={false}
          className="apartment-map__leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          <ZoomControl position="topright" />

          <Marker position={mapCenter} icon={apartmentMarkerIcon}>
            <Popup>
              <strong>{apartment.title}</strong>
              <br />
              {addressText}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="apartment-map-footer">
        <span className="apartment-map-footer__pin">●</span>

        <p className="apartment-map__text">{getMapDescription()}</p>
      </div>
    </section>
  );
}