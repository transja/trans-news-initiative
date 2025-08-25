import { csvParse } from 'd3-dsv';

/**
 * Loads and parses a CSV file from a given path.
 *
 * @param {string} path - The path to the CSV file.
 * @returns {Promise<Array<Object>>} - A promise that resolves with the parsed CSV data.
 */
export async function loadCsv(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load CSV from ${path}: ${response.statusText}`);
    }
    const text = await response.text();
    return csvParse(text);
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}
