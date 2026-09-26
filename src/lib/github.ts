export interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  workflow_id: number;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  duration_seconds: number;
}

export interface WorkerUsageReport {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  totalDurationSeconds: number;
  totalMinutesUsed: number;
  monthlyFreeQuotaMinutes: number;
  remainingQuotaMinutes: number;
  percentQuotaUsed: number;
  averageRunSeconds: number;
  latestRuns: WorkflowRun[];
  isQuotaEstimated: boolean;
}

const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = process.env.GH_OWNER || 'Subhan-Builds';
const GH_REPO = process.env.GH_REPO || 'IG-UPLOAD-ENGINE';

const headers = {
  Authorization: `token ${GH_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'IG-Engine-Cockpit',
};

export async function triggerWorkflow(workflowFileName: string, ref = 'main') {
  if (!GH_TOKEN) {
    throw new Error('GH_TOKEN environment variable is not configured');
  }

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${workflowFileName}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ref }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub workflow dispatch failed (${res.status}): ${errorText}`);
  }

  return { success: true, message: `Dispatched ${workflowFileName} on branch ${ref}` };
}

export async function getWorkflowRuns(limit = 30): Promise<WorkflowRun[]> {
  if (!GH_TOKEN) {
    return [];
  }

  try {
    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/runs?per_page=${limit}`;
    const res = await fetch(url, { headers, next: { revalidate: 30 } });
    if (!res.ok) return [];

    const data = await res.json();
    const rawRuns = data.workflow_runs || [];

    return rawRuns.map((r: any) => {
      const start = new Date(r.run_started_at || r.created_at).getTime();
      const end = new Date(r.updated_at).getTime();
      const duration_seconds = Math.max(0, Math.round((end - start) / 1000));

      return {
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        workflow_id: r.workflow_id,
        html_url: r.html_url,
        created_at: r.created_at,
        updated_at: r.updated_at,
        run_started_at: r.run_started_at,
        duration_seconds,
      };
    });
  } catch (err) {
    console.error('Failed to fetch GitHub workflow runs:', err);
    return [];
  }
}

export async function getWorkerUsage(): Promise<WorkerUsageReport> {
  const runs = await getWorkflowRuns(50);

  let totalDurationSeconds = 0;
  let successfulRuns = 0;
  let failedRuns = 0;
  let inProgressRuns = 0;

  for (const r of runs) {
    totalDurationSeconds += r.duration_seconds;
    if (r.conclusion === 'success') successfulRuns++;
    else if (r.conclusion === 'failure') failedRuns++;
    else if (r.status === 'in_progress' || r.status === 'queued') inProgressRuns++;
  }

  const totalMinutesUsed = Math.ceil(totalDurationSeconds / 60);
  const monthlyFreeQuotaMinutes = 2000; // GitHub Free monthly quota for private repos
  const remainingQuotaMinutes = Math.max(0, monthlyFreeQuotaMinutes - totalMinutesUsed);
  const percentQuotaUsed = parseFloat(((totalMinutesUsed / monthlyFreeQuotaMinutes) * 100).toFixed(2));
  const averageRunSeconds = runs.length > 0 ? Math.round(totalDurationSeconds / runs.length) : 0;

  return {
    totalRuns: runs.length,
    successfulRuns,
    failedRuns,
    inProgressRuns,
    totalDurationSeconds,
    totalMinutesUsed,
    monthlyFreeQuotaMinutes,
    remainingQuotaMinutes,
    percentQuotaUsed,
    averageRunSeconds,
    latestRuns: runs.slice(0, 10),
    isQuotaEstimated: true, // Clearly stated: calculated estimate from workflow execution timings
  };
}
