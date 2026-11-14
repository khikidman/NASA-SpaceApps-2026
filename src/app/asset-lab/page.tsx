import type { Metadata } from "next";
import { AssetLab } from "../../../asset-lab/AssetLab";
export const metadata: Metadata = { title: "Asset Lab | Space Apps", robots: { index: false, follow: false } };
export default function AssetLabPage() { return <AssetLab />; }
