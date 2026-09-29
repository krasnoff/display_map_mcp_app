export type MapStyleOption = {
  id: string;
  label: string;
};

export type MapStyleGroup = {
  label: string;
  styles: readonly MapStyleOption[];
};

export const DEFAULT_MAP_STYLE = "streets-v4";

// MapTiler's current built-in reference styles and their supported variants.
export const MAP_STYLE_GROUPS: readonly MapStyleGroup[] = [
  { label: "Aquarelle", styles: [
    { id: "aquarelle-v4", label: "Default" },
    { id: "aquarelle-v4-dark", label: "Dark" },
    { id: "aquarelle-v4-vivid", label: "Vivid" },
  ] },
  { label: "Backdrop", styles: [
    { id: "backdrop-v4", label: "Default" },
    { id: "backdrop-v4-dark", label: "Dark" },
    { id: "backdrop-v4-light", label: "Light" },
  ] },
  { label: "Base", styles: [
    { id: "base-v4", label: "Default" },
    { id: "base-v4-dark", label: "Dark" },
    { id: "base-v4-light", label: "Light" },
    { id: "base-v4-ai", label: "AI" },
  ] },
  { label: "Bright", styles: [
    { id: "bright-v2", label: "Default" },
    { id: "bright-v2-dark", label: "Dark" },
    { id: "bright-v2-light", label: "Light" },
    { id: "bright-v2-pastel", label: "Pastel" },
  ] },
  { label: "Dataviz", styles: [
    { id: "dataviz-v4", label: "Default" },
    { id: "dataviz-v4-dark", label: "Dark" },
    { id: "dataviz-v4-light", label: "Light" },
  ] },
  { label: "Hybrid", styles: [
    { id: "hybrid-v4", label: "Default" },
    { id: "hybrid-v4-dark", label: "Dark" },
  ] },
  { label: "Landscape", styles: [
    { id: "landscape-v4", label: "Default" },
    { id: "landscape-v4-dark", label: "Dark" },
    { id: "landscape-v4-vivid", label: "Vivid" },
  ] },
  { label: "Ocean", styles: [
    { id: "ocean-v4", label: "Default" },
    { id: "ocean-v4-dark", label: "Dark" },
  ] },
  { label: "OpenStreetMap", styles: [
    { id: "openstreetmap", label: "Default" },
    { id: "openstreetmap-dark", label: "Dark" },
  ] },
  { label: "Outdoor", styles: [
    { id: "outdoor-v4", label: "Default" },
    { id: "outdoor-v4-dark", label: "Dark" },
  ] },
  { label: "Satellite", styles: [
    { id: "satellite-v4", label: "Default" },
    { id: "satellite-v4-dark", label: "Dark" },
  ] },
  { label: "Streets", styles: [
    { id: "streets-v4", label: "Default" },
    { id: "streets-v4-dark", label: "Dark" },
    { id: "streets-v4-pastel", label: "Pastel" },
  ] },
  { label: "Toner", styles: [
    { id: "toner-v2", label: "Default" },
    { id: "toner-v2-lite", label: "Lite" },
  ] },
  { label: "Topo", styles: [
    { id: "topo-v4", label: "Default" },
    { id: "topo-v4-dark", label: "Dark" },
    { id: "topo-v4-pastel", label: "Pastel" },
    { id: "topo-v4-topographique", label: "Topographique" },
  ] },
  { label: "Winter", styles: [
    { id: "winter-v4", label: "Default" },
    { id: "winter-v4-dark", label: "Dark" },
  ] },
];
