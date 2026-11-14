export interface PromotionRecord { format: string; status: string; destination: string; beforeContent: string; beforeHash: string; afterHash: string; [key: string]: unknown }
export function planRollback(record: PromotionRecord, root: string): Promise<{destination: string; before: string; after: string}>;
export function applyRollback(record: PromotionRecord, root: string, recordPath: string): Promise<void>;
