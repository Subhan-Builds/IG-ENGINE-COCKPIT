import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export interface Experiment {
  id: string;
  name: string;
  objective: string;
  variable_tested: 'posting_time' | 'caption_structure' | 'hashtag_count' | 'post_frequency';
  control_baseline: string;
  variants: string[];
  metrics_to_evaluate: string[];
  start_date: string;
  end_date: string;
  posts_per_day: number;
  sample_size_target: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
}

const DEFAULT_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-01-posting-time',
    name: 'PKT Posting-Time Engagement Optimization',
    objective:
      'Measure whether evening slots (17:00, 21:00 PKT) outperform the morning baseline slot (09:00 PKT) in Reel plays and interaction rate.',
    variable_tested: 'posting_time',
    control_baseline: '09:00 PKT (Baseline)',
    variants: ['09:00 PKT (Baseline)', '13:00 PKT', '17:00 PKT', '21:00 PKT'],
    metrics_to_evaluate: ['views', 'reach', 'likes', 'comments', 'saved', 'shares'],
    start_date: '2026-09-25T00:00:00Z',
    end_date: '2026-10-25T00:00:00Z',
    posts_per_day: 4,
    sample_size_target: 30,
    status: 'active',
    created_at: '2026-09-25T12:00:00Z',
  },
];

async function getStoredExperiments(): Promise<Experiment[]> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'experiments_store')
      .single();

    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
  } catch (err) {}
  return DEFAULT_EXPERIMENTS;
}

async function saveStoredExperiments(experiments: Experiment[]) {
  await supabaseAdmin.from('settings').upsert({
    key: 'experiments_store',
    value: JSON.stringify(experiments),
    description: 'Experiment Lab active and archived experiments',
    updated_at: new Date().toISOString(),
  });
}

export async function GET() {
  try {
    const experiments = await getStoredExperiments();
    const { data: experimentModeSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'experiment_mode')
      .single();

    const isExperimentMode = experimentModeSetting?.value === 'true';

    // Fetch published videos to correlate with experiment variants
    const { data: publishedVideos } = await supabaseAdmin
      .from('videos')
      .select('id, scheduled_at, published_at, instagram_media_id')
      .eq('status', 'published');

    return NextResponse.json({
      experiments,
      isExperimentMode,
      totalPublishedCount: publishedVideos?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, experiment, isExperimentMode } = body;

    if (action === 'toggle_mode') {
      await supabaseAdmin.from('settings').upsert({
        key: 'experiment_mode',
        value: isExperimentMode ? 'true' : 'false',
        description: 'Global toggle enabling Experiment Mode in scheduler',
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, isExperimentMode });
    }

    if (action === 'create' && experiment) {
      const current = await getStoredExperiments();
      const newExp: Experiment = {
        ...experiment,
        id: `exp-${Date.now().toString(36)}`,
        created_at: new Date().toISOString(),
      };
      const updated = [newExp, ...current];
      await saveStoredExperiments(updated);
      return NextResponse.json({ success: true, experiment: newExp });
    }

    if (action === 'update' && experiment?.id) {
      const current = await getStoredExperiments();
      const updated = current.map((e) => (e.id === experiment.id ? { ...e, ...experiment } : e));
      await saveStoredExperiments(updated);
      return NextResponse.json({ success: true, experiment });
    }

    if (action === 'delete' && body.id) {
      const current = await getStoredExperiments();
      const updated = current.filter((e) => e.id !== body.id);
      await saveStoredExperiments(updated);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid experiment action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
