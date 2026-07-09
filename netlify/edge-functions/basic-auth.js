const USER = "zycc";
const PASSWORD = "ZyccRecruit2026";
const EXPECTED = `Basic ${btoa(`${USER}:${PASSWORD}`)}`;

export default async (request, context) => {
  if (request.headers.get("authorization") === EXPECTED) {
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
