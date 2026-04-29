const HOST_PROTOCOL = /^https?:\/\//i;

const normalizeConfiguredOrigin = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  try {
    const url = HOST_PROTOCOL.test(trimmed)
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);

    return {
      raw: trimmed,
      origin: HOST_PROTOCOL.test(trimmed) ? url.origin.toLowerCase() : null,
      host: url.host.toLowerCase()
    };
  } catch (err) {
    return null;
  }
};

const parseAllowedOrigins = (originsValue) =>
  String(originsValue || '')
    .split(',')
    .map(normalizeConfiguredOrigin)
    .filter(Boolean);

const normalizeRequestOrigin = (origin) => {
  if (!origin) return null;

  try {
    const url = new URL(origin);
    return {
      origin: url.origin.toLowerCase(),
      host: url.host.toLowerCase()
    };
  } catch (err) {
    return null;
  }
};

const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return true;
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) return true;

  const normalizedOrigin = normalizeRequestOrigin(origin);
  if (!normalizedOrigin) return false;

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.origin && allowedOrigin.origin === normalizedOrigin.origin) {
      return true;
    }

    return allowedOrigin.host === normalizedOrigin.host;
  });
};

module.exports = {
  parseAllowedOrigins,
  isOriginAllowed
};
