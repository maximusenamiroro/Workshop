import ProductCard from "./ProductCard";

export default function ProductGroup({ title, products }) {

  if (!products.length) return null;

  return (
    <div className="mt-6">

      <h2 className="text-white text-lg font-semibold mb-3">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

    </div>
  );
}
