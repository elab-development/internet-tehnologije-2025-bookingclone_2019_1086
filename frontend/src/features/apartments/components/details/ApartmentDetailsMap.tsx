import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import {
  Circle,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
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
import {
  BASE_LAYERS,
  DEFAULT_BASE_LAYER_ID,
  NEIGHBOURHOOD_CIRCLE_STYLE,
  NEIGHBOURHOOD_RADIUS_METERS,
  WALKING_CIRCLE_STYLE,
  WALKING_RADIUS_METERS,
} from "./map/mapLayers";

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

  function renderBaseLayers() {
    return BASE_LAYERS.map((layer) => (
      <LayersControl.BaseLayer
        key={layer.id}
        name={t(`apartments.details.map.layers.${layer.id}`)}
        checked={layer.id === DEFAULT_BASE_LAYER_ID}
      >
        <TileLayer
          attribution={layer.attribution}
          url={layer.url}
          maxZoom={layer.maxZoom}
        />
      </LayersControl.BaseLayer>
    ));
  }

  function renderAreaOverlays() {
    // Drawing a walking radius around a guessed city centre would be a lie, so
    // the rings only appear once the apartment was actually geocoded.
    if (!position.hasExactCoordinates) {
      return null;
    }

    return (
      <>
        {/* Both rings start off, so the map opens clean and the guest turns
            them on only if they care about the surroundings. */}
        <LayersControl.Overlay
          name={t("apartments.details.map.overlays.walking")}
        >
          <Circle
            center={mapCenter}
            radius={WALKING_RADIUS_METERS}
            pathOptions={WALKING_CIRCLE_STYLE}
          >
            <Popup>{t("apartments.details.map.overlays.walkingHint")}</Popup>
          </Circle>
        </LayersControl.Overlay>

        <LayersControl.Overlay
          name={t("apartments.details.map.overlays.neighbourhood")}
        >
          <Circle
            center={mapCenter}
            radius={NEIGHBOURHOOD_RADIUS_METERS}
            pathOptions={NEIGHBOURHOOD_CIRCLE_STYLE}
          >
            <Popup>
              {t("apartments.details.map.overlays.neighbourhoodHint")}
            </Popup>
          </Circle>
        </LayersControl.Overlay>
      </>
    );
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
          <LayersControl position="topleft" collapsed>
            {renderBaseLayers()}
            {renderAreaOverlays()}
          </LayersControl>

          <ZoomControl position="topright" />
          <ScaleControl position="bottomleft" imperial={false} />

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
