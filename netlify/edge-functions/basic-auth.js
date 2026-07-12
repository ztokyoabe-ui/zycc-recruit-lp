// Credentials are read from Netlify environment variables (Site settings >
// Environment variables), never hardcoded here. Set BASIC_AUTH_USER and
// BASIC_AUTH_PASSWORD on Netlify before deploying this file.
export default async (request, context) => {
  const user = Deno.env.get("BASIC_AUTH_USER");
  const password = Deno.env.get("BASIC_AUTH_PASSWORD");

  if (!user || !password) {
    // Fail closed: if the environment variables are not configured,
    // do not fall back to a hardcoded credential.
    return new Response("Basic auth is not configured", { status: 500 });
  }

  const expected = `Basic ${btoa(`${user}:${password}`)}`;

  if (request.headers.get("authorization") === expected) {
    return context.next();
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="ZYCC Recruit"',
      "cache-control": "no-store"
    }
  });
};
