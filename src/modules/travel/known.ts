/** Whether `key` is one of a group's keys in the module's words (a kind of activity, a
 *  suggestion, an error code): the server may send one this build doesn't word yet. */
export function isKnown<T extends object>(group: T, key: string): key is Extract<keyof T, string> {
  return Object.hasOwn(group, key);
}
