import { unwrap } from '@/core/api/client';

/** Hand a file to the browser as a download, then let go of it. */
export function offerDownload(file: Blob, name: string): void {
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  // Once the browser has taken the file, the link to it is let go.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  });
}

/** The file's name as the server gave it (Content-Disposition), else `fallback`. */
function nameOf(response: Response, fallback: string): string {
  const match = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '');
  return match?.[1] ?? fallback;
}

/**
 * Save a file the API sends. It is fetched with the user's session (a plain link can't carry
 * it), then handed to the browser as a download, under the name the server gave it.
 */
export async function saveFile(
  request: Promise<{ data?: Blob; error?: unknown; response: Response }>,
  fallbackName: string,
): Promise<string> {
  const file = await unwrap(request);
  const name = nameOf((await request).response, fallbackName);
  offerDownload(file, name);
  return name;
}
