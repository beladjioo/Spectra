// Licence Pro hors-ligne (l'appareil tourne sans internet, souvent en zone
// blanche) : clé au format RFA-XXXXXX-CCCC où CCCC est une somme de contrôle
// du bloc central. Générée par tools/genkey.mjs. C'est une barrière honnête,
// pas du DRM — le produit est open-source, la clé finance le contenu.

const STORAGE_KEY = "rfa-license";

function checksum(s: string): string {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
}

export function validateKey(key: string): boolean {
  const m = key.trim().toUpperCase().match(/^RFA-([0-9A-Z]{6})-([0-9A-Z]{4})$/);
  return !!m && checksum(m[1]) === m[2];
}

export function isPro(): boolean {
  try {
    return validateKey(localStorage.getItem(STORAGE_KEY) || "");
  } catch {
    return false;
  }
}

/** Active une clé si elle est valide ; renvoie le succès. */
export function activate(key: string): boolean {
  if (!validateKey(key)) return false;
  localStorage.setItem(STORAGE_KEY, key.trim().toUpperCase());
  return true;
}
