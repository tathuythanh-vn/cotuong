function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  );
}

function normalizeConfiguredUrl(configuredUrl: string): string {
  if (typeof window === 'undefined') {
    return trimTrailingSlash(configuredUrl);
  }

  try {
    const parsed = new URL(configuredUrl);
    const pageHost = window.location.hostname;
    const pageProtocol =
      window.location.protocol === 'https:' ? 'https:' : 'http:';

    if (isLocalHostname(parsed.hostname) && !isLocalHostname(pageHost)) {
      parsed.hostname = pageHost;
      parsed.protocol = pageProtocol;
    }

    return trimTrailingSlash(parsed.toString());
  } catch {
    return trimTrailingSlash(configuredUrl);
  }
}

export function getServerUrl(): string {
  const configured = import.meta.env.VITE_SERVER_URL;
  if (configured) {
    return normalizeConfiguredUrl(configured);
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_SERVER_PORT || '4000';

  return `${protocol}//${host}:${port}`;
}
