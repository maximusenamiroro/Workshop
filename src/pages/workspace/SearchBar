import { Search } from "lucide-react";

export default function SearchBar({ search, setSearch }) {
  return (
    <div className="mb-5">

      <div className="flex items-center bg-[#101623] rounded-lg px-3 py-2">

        <Search size={18} className="text-gray-400" />

        <input
          type="text"
          placeholder="Search electrician, driver, cleaner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none text-white ml-2 w-full"
        />

      </div>

    </div>
  );
}
