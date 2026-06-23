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

type Props = {
  apartment: ApartmentDetailsDto;
};

type MapPosition = {
  latitude: number;
  longitude: number;
  hasExactCoordinates: boolean;
};

const DEFAULT_MAP_POSITION: MapPosition = {
  latitude: 44.8125,
  longitude: 20.4612,
  hasExactCoordinates: false,
};

const apartmentMarkerIcon = L.divIcon({
  className: "apartment-map-marker",
  html: '<span class="apartment-map-marker__dot"></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

function getValidCoordinate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function getMapPosition(apartment: ApartmentDetailsDto): MapPosition {
  const latitude = getValidCoordinate(apartment.latitude);
  const longitude = getValidCoordinate(apartment.longitude);

  if (latitude !== null && longitude !== null) {
    return {
      latitude,
      longitude,
      hasExactCoordinates: true,
    };
  }

  return DEFAULT_MAP_POSITION;
}

function buildAddressText(apartment: ApartmentDetailsDto) {
  const parts = [apartment.address, apartment.city, apartment.country].filter(
    Boolean
  );

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return "Belgrade";
}

function buildOpenMapUrl(apartment: ApartmentDetailsDto, position: MapPosition) {
  if (position.hasExactCoordinates) {
    return `https://www.openstreetmap.org/?mlat=${position.latitude}&mlon=${position.longitude}#map=17/${position.latitude}/${position.longitude}`;
  }

  const query = encodeURIComponent(buildAddressText(apartment));

  return `https://www.openstreetmap.org/search?query=${query}`;
}

export default function ApartmentDetailsMap({ apartment }: Props) {
  const { t } = useTranslation();

  const position = useMemo(() => getMapPosition(apartment), [apartment]);

  const mapCenter = useMemo<[number, number]>(() => {
    return [position.latitude, position.longitude];
  }, [position]);

  const zoom = position.hasExactCoordinates ? 17 : 14;

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

          <p className="apartment-map-header__address">
            {buildAddressText(apartment)}
          </p>
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
              {buildAddressText(apartment)}
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