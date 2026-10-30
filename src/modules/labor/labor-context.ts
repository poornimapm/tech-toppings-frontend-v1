import { useOutletContext } from 'react-router';

import type { Project } from '@/modules/labor/api';

export interface LaborContext {
  /** The project the page works on: from the address, or the one used last on this device. */
  projectId: string | null;
  project: Project | undefined;
}

export function useLabor(): LaborContext {
  return useOutletContext<LaborContext>();
}
