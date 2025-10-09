import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export async function getMonthlyCounts() {
  console.time('supabase.getMonthlyCounts');
  const { data, error } = await supabase.rpc('articles_monthly_counts_by_theme');
  if (error) throw error;
  console.timeEnd('supabase.getMonthlyCounts');
  return data.filter(d => d.theme != "uncategorized") || [];
}

export async function getTotalArticleCount() {
  console.time('supabase.getTotalArticleCount');
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  console.timeEnd('supabase.getTotalArticleCount');
  return count;
}

const CHUNK = 1000; // PostgREST per-request cap

export async function getArticlesByTheme(theme) {
  console.time(`supabase.getArticlesByTheme (${theme})`);
  if (!theme) {
    console.timeEnd(`supabase.getArticlesByTheme (${theme})`);
    return [];
  }
  const key = theme.trim();

  // 1) get total count
  const { data: countData, error: countErr } = await supabase.rpc(
    'get_articles_by_theme_count',
    { theme: key }
  );
  if (countErr) throw countErr;

  const total = Number(countData || 0);
  if (!total) {
    console.timeEnd(`supabase.getArticlesByTheme (${theme})`);
    return [];
  }

  const pages = Math.ceil(total / CHUNK);

  // 2) fire all pages in parallel
  const calls = Array.from({ length: pages }, (_, i) =>
    supabase.rpc('get_articles_by_theme_page', {
      theme: key,
      limit_: CHUNK,
      offset_: i * CHUNK
    })
  );

  const results = await Promise.all(calls);

  // 3) collect rows (and surface the first error if any)
  const out = [];
  for (const r of results) {
    if (r.error) throw r.error;
    if (r.data) out.push(...r.data);
  }
  console.timeEnd(`supabase.getArticlesByTheme (${theme})`);
  return out;
}