interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = authHeader.slice(7);

  // Verify user from access token
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await userRes.json() as { id: string };

  // Delete user with admin API
  const deleteRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!deleteRes.ok) {
    return Response.json({ error: 'Failed to delete account' }, { status: 500 });
  }

  return Response.json({ success: true });
};
