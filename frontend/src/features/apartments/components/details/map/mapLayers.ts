export type BaseLayerDefinition = {
  // Also the translation key under apartments.details.map.layers
  id: string;
  url: string;
  attribution: string;
  maxZoom: number;
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// All of these serve tiles without an API key, so the map keeps working for
// anyone who clones the project.
export const BASE_LAYERS: BaseLayerDefinition[] = [
  {
    id: "standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
  },
  {
    id: "humanitarian",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: `${OSM_ATTRIBUTION}, tiles by <a href="https://www.hotosm.org/">HOT</a>`,
    maxZoom: 20,
  },
  {
    id: "satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics',
    maxZoom: 19,
  },
  {
    id: "terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: `${OSM_ATTRIBUTION}, <a href="https://opentopomap.org">OpenTopoMap</a>`,
    maxZoom: 17,
  },
];

export const DEFAULT_BASE_LAYER_ID = "humanitarian";

// Roughly what a guest can walk in five and in twenty minutes.
export const WALKING_RADIUS_METERS = 500;
export const NEIGHBOURHOOD_RADIUS_METERS = 1500;

export const WALKING_CIRCLE_STYLE = {
  color: "#2563eb",
  weight: 2,
  fillColor: "#2563eb",
  fillOpacity: 0.12,
};

export const NEIGHBOURHOOD_CIRCLE_STYLE = {
  color: "#0f766e",
  weight: 2,
  // Dashed, so the wider ring reads as an estimate rather than a boundary.
  dashArray: "6 6",
  fillColor: "#0f766e",
  fillOpacity: 0.05,
};
