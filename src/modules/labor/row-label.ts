/**
 * A list row's button, named by its own words and then the row's (a worker's name): "Pay
 * Meena", so a screen reader tells one row's button from the next. Its visible words come
 * first, so voice control still finds it by what it shows. `whose` is the id of the element
 * holding the row's name.
 */
export const rowButton = (id: string, whose: string) => ({
  id,
  'aria-labelledby': `${id} ${whose}`,
});

/** The id of a row's name, from the record it shows (unique on the page). */
export const rowName = (record: string) => `labor-name-${record}`;
