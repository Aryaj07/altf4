import { getCategories, getProducts } from 'lib/medusa';
import { MetadataRoute } from 'next';

type Route = {
  url: string;
  lastModified: string;
};

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routesMap = ['', '/search', '/contact', '/privacy', '/terms-and-condition', '/shipping-policy'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString()
  }));

  const collections = await getCategories();
  const collectionsPromise = collections.map((collection) => ({
    url: `${baseUrl}${collection.path}`,
    lastModified: new Date(collection.updatedAt).toISOString()
  }));

  const productsPromise = getProducts({}).then((products) =>
    products.map((product) => ({
      url: `${baseUrl}/product/${product.handle}`,
      lastModified: new Date(product.updatedAt).toISOString()
    }))
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (await Promise.all([collectionsPromise, productsPromise])).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...routesMap, ...fetchedRoutes];
}
