import { NextRequest, NextResponse } from 'next/server';
import { validateDriveFolder } from '@/lib/drive';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { folderId } = body;

    if (!folderId) {
      return NextResponse.json({ error: 'Google Drive folderId or URL is required.' }, { status: 400 });
    }

    const result = await validateDriveFolder(folderId);
    if (!result.valid) {
      return NextResponse.json(
        {
          error: result.error,
          saEmail: result.saEmail,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      success: true,
      folderId: result.folderId,
      folderName: result.folderName,
      videoCount: result.videoCount,
      sampleVideos: result.sampleVideos,
      warning: result.error,
      saEmail: result.saEmail,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Validation request failed' }, { status: 500 });
  }
}
