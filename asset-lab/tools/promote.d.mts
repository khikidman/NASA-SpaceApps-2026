import type { AssetPackage } from "../core/package.mjs";
export interface PromotionPlan { target: string; before: string; after: string; outputs: {path: string; bytes: Uint8Array; sha256: string}[]; afterHash: string; recordPath: string }
export function planPromotion(pkg: AssetPackage, root: string): Promise<PromotionPlan>;
export function applyPromotion(pkg: AssetPackage, root: string, plan: PromotionPlan): Promise<void>;
