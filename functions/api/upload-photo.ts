interface Env {
  R2_BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

async function getUserId(env: Env, accessToken: string): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) return null;
  const user = await res.json() as { id: string };
  return user.id;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(context.env, authHeader.slice(7));
    if (!userId) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await context.request.json() as { image: string };
    if (!body.image) {
      return Response.json({ error: 'Image required' }, { status: 400 });
    }

    // Strip data URL prefix
    const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Determine content type
    const contentType = body.image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const ext = contentType === 'image/png' ? 'png' : 'jpg';

    // Upload to R2
    const key = `profiles/${userId}/photo.${ext}`;
    await context.env.R2_BUCKET.put(key, binaryData, {
      httpMetadata: { contentType },
    });

    // Return the public URL (R2 custom domain or r2.dev)
    // The actual URL depends on R2 public access config
    const photoUrl = `https://pub-f912e0aa955046d390bf74abcc03725b.r2.dev/${key}`;

    return Response.json({ url: photoUrl }, {
      headers: {
        'Access-Control-Allow-Origin': context.request.headers.get('origin') || '*',
      },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get('origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
