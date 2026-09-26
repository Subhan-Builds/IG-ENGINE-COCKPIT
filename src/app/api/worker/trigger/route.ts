import { NextRequest, NextResponse } from 'next/server';
import { triggerWorkflow } from '@/lib/github';

export const dynamic = 'force-dynamic';

const VALID_WORKFLOWS: Record<string, string> = {
  importer: 'importer.yml',
  publisher: 'publisher.yml',
  maintenance: 'maintenance.yml',
  keepalive: 'keepalive.yml',
};

export async function POST(req: NextRequest) {
  try {
    const { workflow } = await req.json();

    const fileName = VALID_WORKFLOWS[workflow];
    if (!fileName) {
      return NextResponse.json(
        { error: `Invalid workflow name: "${workflow}". Must be one of: ${Object.keys(VALID_WORKFLOWS).join(', ')}` },
        { status: 400 }
      );
    }

    const result = await triggerWorkflow(fileName);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Trigger workflow error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
