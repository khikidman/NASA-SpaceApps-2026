import catalog from "./catalog/lab-assets.json";
export interface LabSpriteAsset {
  id: string; title: string; revisionId: string; src: string; originalSrc: string;
  width: number; height: number; frameWidth: number; frameHeight: number;
  anchorX: number; anchorY: number; scale: number; packageDigest: string; promotion: string;
}
export function getLabSprite(id: string): LabSpriteAsset | undefined {
  return Object.hasOwn(catalog.assets, id) ? (catalog.assets as Record<string, LabSpriteAsset>)[id] : undefined;
}
