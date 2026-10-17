import { createFileRoute, notFound } from "@tanstack/react-router";
import { ApiError } from "~/features/shop/api/http";
import { productDetailQuery } from "~/features/shop/hooks/use-shop-queries";
import ProductDetailPage from "~/features/shop/view/product-detail-page";
import { NotFound } from "~/components/NotFound";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/_shop/products/$slug")({
  loader: async ({ params, context }) => {
    try {
      const data = await context.queryClient.ensureQueryData(
        productDetailQuery(params.slug),
      );
      return {
        title: data.name,
        description: data.description,
        image: data.gallery[0] ?? data.image,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) throw notFound();
      throw err;
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      ...seo({
        title: loaderData
          ? `${loaderData.title} — Delysa Florist`
          : "Detail Produk — Delysa Florist",
        description: loaderData?.description,
        image: loaderData?.image,
      }),
    ],
  }),
  notFoundComponent: () => (
    <NotFound>
      <p>
        Produk yang Anda cari tidak tersedia atau tautannya kurang tepat.
        Jelajahi koleksi segar kami yang lain.
      </p>
    </NotFound>
  ),
  component: ProductRouteComponent,
});

function ProductRouteComponent() {
  const { slug } = Route.useParams();
  return <ProductDetailPage slug={slug} />;
}
