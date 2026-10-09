import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin.from('videos').select('*').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: videos, error } = await query;
    if (error) throw error;

    // Load video_account_assignments from settings for fallback mapping
    const { data: settingsRow } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'video_account_assignments')
      .single();

    let assignments: Record<string, string> = {};
    if (settingsRow?.value) {
      try {
        assignments = JSON.parse(settingsRow.value);
      } catch {
        // Ignore JSON parse errors
      }
    }

    const augmentedVideos = (videos || []).map((v: any) => ({
      ...v,
      account_id: v.account_id || assignments[v.id] || 'acc_lifefuel_01',
    }));

    return NextResponse.json({ videos: augmentedVideos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, caption, scheduled_at, status, account_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (caption !== undefined) updates.caption = caption;
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
    if (status !== undefined) updates.status = status;

    // 1. If account_id provided, attempt direct column update
    if (account_id !== undefined) {
      try {
        await supabaseAdmin.from('videos').update({ account_id }).eq('id', id);
      } catch {
        // Column may not exist yet
      }

      // Always synchronize to video_account_assignments in settings
      const { data: settingsRow } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'video_account_assignments')
        .single();

      let assignments: Record<string, string> = {};
      if (settingsRow?.value) {
        try {
          assignments = JSON.parse(settingsRow.value);
        } catch {}
      }
      assignments[id] = account_id;
      await supabaseAdmin.from('settings').upsert({
        key: 'video_account_assignments',
        value: JSON.stringify(assignments),
      });
    }

    // 2. Perform main updates
    let updatedVideo = null;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      updatedVideo = data;
    } else {
      const { data } = await supabaseAdmin.from('videos').select('*').eq('id', id).single();
      updatedVideo = data;
    }

    return NextResponse.json({
      success: true,
      video: {
        ...updatedVideo,
        account_id: account_id || updatedVideo?.account_id || 'acc_lifefuel_01',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
