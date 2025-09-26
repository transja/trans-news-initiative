import { writable } from "svelte/store";

export const activeTheme = writable(null);
export const inThemeView = writable(false);