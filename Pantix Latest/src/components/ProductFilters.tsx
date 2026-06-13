import { type Category } from "@/lib/products";
import { useStore } from "@/lib/store";

export const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "Free Size",
];

type Props = {
  selectedCats?: string[];
  setSelectedCats?: (v: string[]) => void;
  showCategories?: boolean;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  selectedSizes: string[];
  setSelectedSizes: (v: string[]) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  onClearAll: () => void;
};

export function ProductFilters({
  selectedCats = [],
  setSelectedCats,
  showCategories = true,
  maxPrice,
  setMaxPrice,
  selectedSizes,
  setSelectedSizes,
  inStockOnly,
  setInStockOnly,
  onClearAll,
}: Props) {
  const { categories } = useStore();
  const toggle = <T,>(arr: T[], v: T, set: (n: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-7">
      {showCategories && setSelectedCats && (
        <FilterSection title="Categories">
          <div className="space-y-2">
            {categories.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm cursor-pointer text-foreground/85 hover:text-gold"
              >
                <input
                  type="checkbox"
                  checked={selectedCats.includes(c.id)}
                  onChange={() => toggle(selectedCats, c.id, setSelectedCats)}
                  className="accent-[hsl(var(--gold))]"
                />
                {c.label}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title={`Max Price: ₹${maxPrice.toLocaleString("en-IN")}`}>
        <input
          type="range"
          min={500}
          max={100000}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[hsl(var(--gold))]"
        />
      </FilterSection>

      <FilterSection title="Sizes">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => {
            const active = selectedSizes.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggle(selectedSizes, s, setSelectedSizes)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  active
                    ? "bg-gold text-primary-foreground border-gold"
                    : "border-gold/30 text-foreground/85 hover:border-gold hover:text-gold"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground/85 hover:text-gold">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-[hsl(var(--gold))]"
          />
          In stock only
        </label>
      </FilterSection>

      <button
        onClick={onClearAll}
        className="w-full text-xs uppercase tracking-[0.25em] py-2.5 border border-gold/40 text-gold hover:bg-gold/10 rounded"
      >
        Clear filters
      </button>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="filter-heading">{title}</h3>
      {children}
    </div>
  );
}
