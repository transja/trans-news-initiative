const BASE_URL = 'https://polygraph-pub.s3.amazonaws.com/trans-journalism-initiative/output';
const DOWNLOADS_URL = 'https://polygraph-pub.s3.amazonaws.com/trans-journalism-initiative/downloads';
const DOWNLOAD_FILENAME = 'tni-data.zip';

const STAGING_FOLDER = '/staging/latest';

// Helper function to add cache busting parameter
function addCacheBuster(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
}

export async function getMonthlyCounts(debug = false, staging = false) {
  if (debug) console.time('aws.getMonthlyCounts');
  const url = addCacheBuster(`${BASE_URL}${staging ? STAGING_FOLDER : '/latest'}/monthly.json`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch monthly counts: ${response.statusText}`);
  }
  const data = await response.json();
  if (debug) console.timeEnd('aws.getMonthlyCounts');
  return data.filter(d => d.theme !== "uncategorized") || [];
}

export async function getTotalArticleCount(debug = false, staging = false) {
  if (debug) console.time('aws.getTotalArticleCount');
  const url = addCacheBuster(`${BASE_URL}${staging ? STAGING_FOLDER : '/latest'}/article_count.json`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch total article count: ${response.statusText}`);
  }
  const data = await response.json();

  if (debug) console.timeEnd('aws.getTotalArticleCount');
  return data.total_articles;
}

export async function getArticlesByTheme(theme, debug = false, staging = false) {
  if (debug) console.time(`aws.getArticlesByTheme (${theme})`);
  if (!theme) {
    if (debug) console.timeEnd(`aws.getArticlesByTheme (${theme})`);
    return [];
  };
  const key = theme.trim();
  const url = addCacheBuster(`${BASE_URL}${staging ? STAGING_FOLDER : '/latest'}/${key}.json`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch articles for theme ${theme}: ${response.statusText}`);
  }
  const data = await response.json();
  if (debug) console.timeEnd(`aws.getArticlesByTheme (${theme})`);

  return data || [];
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

// Must match `echo -n "<password>" | shasum -a 256` used to name the S3 folder
export async function getDataDownloadUrl(password) {
  const hash = await sha256(password);
  const url = `${DOWNLOADS_URL}/${hash}/${DOWNLOAD_FILENAME}`;
  const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  if (response.ok) return url;
  if (response.status === 403 || response.status === 404) return null;
  throw new Error(`Failed to check data download: ${response.statusText}`);
}
