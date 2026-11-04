import { fa } from './fa';
import { en } from './en';

// Keep the two UI dictionaries structurally aligned as labels are added.
export const translations = { fa, en: en satisfies Record<keyof typeof fa, string> };
export type Language = keyof typeof translations;
