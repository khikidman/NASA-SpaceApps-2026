import type { LunarSettings } from "../../src/assets/lunar-settings.mjs";
export interface SourceSnapshot { gitCommit: string | null; dirty: boolean; files: { path: string; sha256: string }[] }
export interface ImageSettings { brightness: number; contrast: number; saturation: number; scale: number; anchorX: number; anchorY: number; frameWidth: number; frameHeight: number }
export interface Revision { id: string; parentId: string | null; createdAt: string; author: string; note: string }
export interface Ancestor extends Revision { assetId: string; digest: string }
export interface PackageFile { name: string; mime: "image/png"; width: number; height: number; base64: string; sha256: string }
export interface AssetPackage { format: "spaceapps.assetlab/v1"; asset: { id: string; title: string; kind: "lunar-recipe" | "sprite" }; revision: Revision; source: SourceSnapshot; generatorVersion: string; lineage: Ancestor[]; environment: { renderer: string; browser: string }; payload: { recipe?: { schemaVersion: 1; generatorVersion: string; settings: LunarSettings }; seed?: number; slot?: number; original?: { name: string; width: number; height: number; inputSha256?: string; inputMime?: string }; settings?: ImageSettings }; files: PackageFile[]; digest: string }
export const PACKAGE_FORMAT: "spaceapps.assetlab/v1";
export const MAX_PACKAGE_BYTES: number;
export const SOURCE_FILES: readonly string[];
export function canonical(value: unknown): string;
export function sha256(value: string | Uint8Array): Promise<string>;
export function decode64(value: string): Uint8Array;
export function validateImageSettings(settings: unknown, width: number, height: number): ImageSettings;
export function validateSource(source: unknown): SourceSnapshot;
export function validatePackage(value: unknown): AssetPackage;
export function sealPackage(unsigned: Omit<AssetPackage,"digest">): Promise<AssetPackage>;
export function verifyPackage(value: unknown): Promise<AssetPackage>;
export function ancestorOf(pkg: AssetPackage): Ancestor;
export function settingsDiff(before: Record<string, unknown> | object, after: Record<string, unknown> | object): {key: string; before: unknown; after: unknown}[];
