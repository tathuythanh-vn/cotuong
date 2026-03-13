function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function getServerUrl(): string {
  const configured = import.meta.env.VITE_SERVER_URL;
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_SERVER_PORT || '4000';

  return `${protocol}//${host}:${port}`;
}
