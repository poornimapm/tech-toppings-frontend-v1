import type { PSM, WorkerParams } from 'tesseract.js';

/**
 * How the on-device reader reads a receipt, here and in `npm run receipt-samples ocr` (which
 * measures it): Tesseract's languages for each app language, and its page settings.
 * Receipts mix scripts (English item names on a Tamil bill), so English is always read too.
 */
export const OCR_LANGUAGES: Record<string, string[]> = {
  en: ['eng'],
  ta: ['tam', 'eng'],
  hi: ['hin', 'eng'],
};

/** The reader's settings, from its page modes (tesseract.js is loaded only when a scan needs
 *  it, so its values come from the caller). */
export function ocrParameters(modes: typeof PSM): Partial<WorkerParams> {
  return {
    // One block of text: a receipt's lines, each read whole, names and figures together.
    tessedit_pageseg_mode: modes.SINGLE_BLOCK,
    // Keep the gaps between columns: they separate an item's name from its figures.
    preserve_interword_spaces: '1',
  };
}
