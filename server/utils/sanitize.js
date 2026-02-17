const STRIP_RE = /[<>{}$/\\]/g;

export const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(STRIP_RE, "").trim();
};

export const sanitizeOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options.map((o) => sanitizeString(o)).filter((o) => o.length > 0);
};
