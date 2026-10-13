const PLACEHOLDER = /{{(\w+)}}/g;

/** `Added “{{title}}”` + `{title: 'Rice'}` -> `Added “Rice”`; unknown names are left as written. */
export function fill(template: string, values: Record<string, unknown>): string {
  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const value = values[name];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : whole;
  });
}
