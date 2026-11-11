/** The trip's pages, fetched through this small chunk: the list of files they need is then
 *  written here, rather than in the manifest that loads with the first page. */
export const tripPages = () => import('@/modules/travel/trip-pages');

/** Planning a trip, fetched the same way: its AI help (Basic AI) needs files of its own. */
export const newTripPage = () => import('@/modules/travel/new-trip-page');
