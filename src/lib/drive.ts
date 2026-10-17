import crypto from 'crypto';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

export function extractDriveFolderId(input: string): string {
  const clean = input.trim();
  const match = clean.match(/folders\/([a-zA-Z0-9_\-]+)/);
  if (match) return match[1];
  const idMatch = clean.match(/^[a-zA-Z0-9_\-]{20,}$/);
  if (idMatch) return clean;
  return clean;
}

function getServiceAccount(): ServiceAccountKey | null {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.client_email && parsed.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      };
    }
  } catch (e) {
    console.error('Error parsing GCP_SERVICE_ACCOUNT_JSON:', e);
  }
  return null;
}

export async function getGoogleAccessToken(): Promise<{ token: string; email: string } | null> {
  const sa = getServiceAccount();
  if (!sa) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signInput = `${b64Header}.${b64Payload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(sa.private_key, 'base64url');

  const assertion = `${signInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token exchange failed: ${errText}`);
  }

  const data = await res.json();
  return { token: data.access_token, email: sa.client_email };
}

export async function validateDriveFolder(folderId: string): Promise<{
  valid: boolean;
  folderId?: string;
  folderName?: string;
  videoCount?: number;
  sampleVideos?: string[];
  error?: string;
  saEmail?: string;
}> {
  try {
    const cleanId = extractDriveFolderId(folderId);
    if (!cleanId || cleanId.length < 10) {
      return { valid: false, error: 'Invalid Google Drive Folder ID format.' };
    }

    const auth = await getGoogleAccessToken();
    if (!auth) {
      return {
        valid: false,
        error: 'Google Service Account credentials (GCP_SERVICE_ACCOUNT_JSON) not configured on server.',
      };
    }

    // 1. Get folder metadata
    const folderRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType,trashed`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );

    if (!folderRes.ok) {
      if (folderRes.status === 404) {
        return {
          valid: false,
          error: `Folder not found or not shared with service account (${auth.email}). Please open Google Drive, right-click the folder > Share > add '${auth.email}' as Viewer.`,
          saEmail: auth.email,
        };
      }
      const err = await folderRes.text();
      return { valid: false, error: `Google Drive API error (${folderRes.status}): ${err}`, saEmail: auth.email };
    }

    const folderData = await folderRes.json();
    if (folderData.mimeType !== 'application/vnd.google-apps.folder') {
      return { valid: false, error: `Item '${folderData.name}' is a file, not a folder.` };
    }
    if (folderData.trashed) {
      return { valid: false, error: `Folder '${folderData.name}' is in Google Drive Trash.` };
    }

    // 2. Count MP4/QuickTime videos in folder
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${cleanId}'+in+parents+and+(mimeType='video/mp4'+or+mimeType='video/quicktime')+and+trashed=false&fields=files(id,name,size,md5Checksum)&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      return { valid: false, error: `Failed to list files inside folder: ${err}` };
    }

    const listData = await listRes.json();
    const files = listData.files || [];
    const videoCount = files.length;
    const sampleVideos = files.slice(0, 5).map((f: any) => f.name);

    if (videoCount === 0) {
      return {
        valid: true,
        folderId: cleanId,
        folderName: folderData.name,
        videoCount: 0,
        sampleVideos: [],
        error: `Folder '${folderData.name}' is accessible, but currently contains 0 MP4 videos.`,
        saEmail: auth.email,
      };
    }

    return {
      valid: true,
      folderId: cleanId,
      folderName: folderData.name,
      videoCount,
      sampleVideos,
      saEmail: auth.email,
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Unknown error validating folder' };
  }
}
