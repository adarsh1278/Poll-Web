import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFP = null;

export const getFingerprint = async () => {
  if (cachedFP) return cachedFP;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  cachedFP = result.visitorId;
  return cachedFP;
};
