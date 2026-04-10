/**
 * GitHub audit — fetches a user's public repos via the GitHub REST API
 * and rolls them up into a coherent picture: top languages, repo counts,
 * total stars, recent activity, project highlights.
 *
 * Optionally authenticated via GITHUB_TOKEN to lift the 60 req/hr unauth
 * limit to 5000 req/hr.
 */

const GH_BASE = "https://api.github.com";

function ghHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "PlaceAI-Diagnostic-Agent",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export interface GitHubRepoSummary {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  isFork: boolean;
}

export interface GitHubAudit {
  username: string;
  name: string | null;
  bio: string | null;
  followers: number;
  publicRepos: number;
  topLanguages: Array<{ language: string; repoCount: number }>;
  totalStars: number;
  recentlyActive: boolean;
  highlightedRepos: GitHubRepoSummary[];
  rawRepos: GitHubRepoSummary[];
}

/**
 * Pull a user profile + their (up to 100) public repos and roll up stats.
 */
export async function auditGitHub(usernameOrUrl: string): Promise<GitHubAudit> {
  const username = extractUsername(usernameOrUrl);
  if (!username) {
    throw new Error(`Could not parse a GitHub username from: ${usernameOrUrl}`);
  }

  const profileRes = await fetch(`${GH_BASE}/users/${username}`, {
    headers: ghHeaders(),
    cache: "no-store",
  });
  if (!profileRes.ok) {
    throw new Error(
      `GitHub profile fetch failed: ${profileRes.status} ${profileRes.statusText}`
    );
  }
  const profile = await profileRes.json();

  const reposRes = await fetch(
    `${GH_BASE}/users/${username}/repos?per_page=100&sort=updated`,
    { headers: ghHeaders(), cache: "no-store" }
  );
  if (!reposRes.ok) {
    throw new Error(
      `GitHub repos fetch failed: ${reposRes.status} ${reposRes.statusText}`
    );
  }
  const repos = (await reposRes.json()) as Array<Record<string, unknown>>;

  const summaries: GitHubRepoSummary[] = repos.map((r) => ({
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    language: (r.language as string | null) ?? null,
    stars: (r.stargazers_count as number) || 0,
    forks: (r.forks_count as number) || 0,
    pushedAt: (r.pushed_at as string) || "",
    isFork: Boolean(r.fork),
  }));

  // Roll up languages (skip forks — they don't reflect what the student built).
  const langCounts = new Map<string, number>();
  for (const r of summaries) {
    if (r.isFork || !r.language) continue;
    langCounts.set(r.language, (langCounts.get(r.language) || 0) + 1);
  }
  const topLanguages = [...langCounts.entries()]
    .map(([language, repoCount]) => ({ language, repoCount }))
    .sort((a, b) => b.repoCount - a.repoCount)
    .slice(0, 6);

  const totalStars = summaries.reduce((s, r) => s + r.stars, 0);

  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentlyActive = summaries.some(
    (r) => r.pushedAt && new Date(r.pushedAt).getTime() > ninetyDaysAgo
  );

  const highlightedRepos = summaries
    .filter((r) => !r.isFork)
    .sort((a, b) => b.stars - a.stars || +new Date(b.pushedAt) - +new Date(a.pushedAt))
    .slice(0, 6);

  return {
    username,
    name: profile.name ?? null,
    bio: profile.bio ?? null,
    followers: profile.followers ?? 0,
    publicRepos: profile.public_repos ?? summaries.length,
    topLanguages,
    totalStars,
    recentlyActive,
    highlightedRepos,
    rawRepos: summaries,
  };
}

function extractUsername(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // URL form
  const urlMatch = trimmed.match(/github\.com\/([A-Za-z0-9-]+)\/?/i);
  if (urlMatch) return urlMatch[1];
  // Bare username form
  if (/^[A-Za-z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
}
