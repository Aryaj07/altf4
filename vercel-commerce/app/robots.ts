const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

export default function robots() {
  console.log("robots.txt generated", baseUrl)
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/*', '/checkout/*', '/api/*', '/_next/*']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
