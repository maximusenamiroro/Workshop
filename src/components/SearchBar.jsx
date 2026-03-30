export default function SearchBar({
  search,
  setSearch,
}) {
  return (
    <input
      type="text"
      placeholder="Search workers, products, or services..."
      className="w-full p-3 mb-4 rounded bg-[#121826] text-white"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
