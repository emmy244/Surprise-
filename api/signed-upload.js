// api/signed-upload.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'user-media'; // <-- make sure this matches the bucket name in Supabase

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) return res.status(400).json({ error: 'Missing filename or contentType' });

    const remotePath = `captures/${filename}`;

    // Create a signed upload URL valid for 1 hour (3600s)
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(remotePath, 60 * 60);

    if (error) {
      console.error('createSignedUploadUrl error', error);
      return res.status(500).json({ error: error.message || JSON.stringify(error) });
    }

    // Optional: public URL if bucket is public
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(remotePath);

    return res.status(200).json({
      putUrl: data.signedUrl,
      publicUrl: pub?.publicUrl || null,
      path: remotePath
    });
  } catch (err) {
    console.error('signed-upload handler err', err);
    return res.status(500).json({ error: String(err) });
  }
}
