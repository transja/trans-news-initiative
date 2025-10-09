const BASE_URL = 'https://polygraph-pub.s3.amazonaws.com/trans-journalism-initiative/output';

export async function getMonthlyCounts() {
  console.time('aws.getMonthlyCounts');
  const url = `${BASE_URL}/monthly.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch monthly counts: ${response.statusText}`);
  }
  const data = await response.json();
  console.timeEnd('aws.getMonthlyCounts');
  return data.filter(d => d.theme !== "uncategorized") || [];
}

export async function getTotalArticleCount() {
  console.time('aws.getTotalArticleCount');
  const url = `${BASE_URL}/article_count.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch total article count: ${response.statusText}`);
  }
  const data = await response.json();

  console.timeEnd('aws.getTotalArticleCount');
  return data.total_articles;
}

export async function getArticlesByTheme(theme) {
  console.time(`aws.getArticlesByTheme (${theme})`);
  if (!theme) {
    console.timeEnd(`aws.getArticlesByTheme (${theme})`);
    return [];
  };
  const key = theme.trim();
  const url = `${BASE_URL}/${key}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch articles for theme ${theme}: ${response.statusText}`);
  }
  const data = await response.json();
  console.timeEnd(`aws.getArticlesByTheme (${theme})`);
  return data || [];
}
