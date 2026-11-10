/** The trip's pages, fetched through this small chunk: the list of files they need is then
 *  written here, rather than in the manifest that loads with the first page. */
export const tripPages = () => import('@/modules/travel/trip-pages');
