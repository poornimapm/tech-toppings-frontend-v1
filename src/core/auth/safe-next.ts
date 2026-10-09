/** Only relative, same-app paths are accepted as a post-login destination (no open redirect). */
export function safeNext(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}
