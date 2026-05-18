export default async (request, context) => {
  const url = new URL(request.url);
  if (!url.pathname.endsWith('.glb')) return context.next();

  const referer = request.headers.get('referer') || '';
  const allowed =
    referer.includes('voldtlab.com') ||
    referer.includes('localhost') ||
    referer.includes('127.0.0.1') ||
    referer.includes('.netlify.app');

  if (!allowed) {
    return Response.redirect(new URL('/404.html', request.url).href, 302);
  }

  return context.next();
};
