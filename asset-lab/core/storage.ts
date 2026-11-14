import type { AssetPackage } from "./package.mjs";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("spaceapps-asset-lab-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("revisions", { keyPath: "revision.id" });
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close another asset-lab tab and try again."));
  });
}
export async function listRevisions(): Promise<AssetPackage[]> {
  const db = await openDB();
  try { return await new Promise((resolve, reject) => { const tx = db.transaction("revisions", "readonly"), request = tx.objectStore("revisions").getAll(); request.onsuccess = () => resolve((request.result as AssetPackage[]).sort((a, b) => b.revision.createdAt.localeCompare(a.revision.createdAt))); request.onerror = () => reject(request.error); }); }
  finally { db.close(); }
}
export async function storeRevision(pkg: AssetPackage) {
  const db = await openDB();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("revisions", "readwrite"); const store = tx.objectStore("revisions"), request = store.get(pkg.revision.id);
      request.onsuccess = () => { if (request.result && request.result.digest !== pkg.digest) { reject(new Error("Revision ID collision: an immutable revision cannot be replaced.")); tx.abort(); } else if (!request.result) store.add(pkg); }; tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); }
  finally { db.close(); }
}
