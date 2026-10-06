import { useState, useMemo } from 'react';
import { 
  Plus, Search, Star, Pencil, Trash2, X, Camera, 
  Package, Check, Tag 
} from 'lucide-react';
import { 
  useProducts, useCategories, useCreateProduct, 
  useUpdateProduct, useDeleteProduct, useToggleFavorite 
} from '@/hooks/useProducts';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Scanner } from '@/components/pos/ScannerModal';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function Products() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [scanSearchOpen, setScanSearchOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: products, isLoading } = useProducts({ search: search || undefined });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const toggleFavorite = useToggleFavorite();

  const triggerHaptic = (pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        (navigator.vibrate as any)(pattern);
      } catch {}
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategory) return products;
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  const handleOpenAdd = () => {
    setEditing(null);
    setShowForm(true);
    triggerHaptic(15);
  };

  const handleOpenEdit = (p: Product) => {
    setEditing(p);
    setShowForm(true);
    triggerHaptic(15);
  };

  const handleSave = async (data: Partial<Product>) => {
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...data });
        toast.success(`Updated "${data.name}"`);
      } else {
        await createProduct.mutateAsync(data);
        toast.success(`Created "${data.name}"`);
      }
      setShowForm(false);
      setEditing(null);
      triggerHaptic(30);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      triggerHaptic(20);
      return;
    }

    try {
      await deleteProduct.mutateAsync(id);
      setConfirmDeleteId(null);
      triggerHaptic(30);
      toast.info(`Deleted "${name}"`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const handleToggleFav = async (p: Product) => {
    try {
      await toggleFavorite.mutateAsync({ id: p.id, isFavorite: !p.is_favorite });
      triggerHaptic(15);
    } catch (e: any) {
      toast.error('Failed to toggle favorite');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden select-none pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Products</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredProducts.length} items cataloged
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Search Bar + Barcode Scan */}
      <div className="py-2.5 space-y-2 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or barcode..."
              className="pl-10 pr-9 h-11 text-base sm:text-sm rounded-xl bg-background border-input shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:bg-muted rounded-md"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setScanSearchOpen(true)}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 active:scale-95 shadow-2xs"
            title="Scan barcode to search"
            aria-label="Scan barcode"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>

        {/* Category Horizontal Filter Chips */}
        {categories && categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border shrink-0 transition-all active:scale-95',
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border shrink-0 transition-all active:scale-95',
                  selectedCategory === c.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-2.5">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/60">
              <Package className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {search ? `No products matching "${search}"` : 'No products found'}
              </p>
              <p className="text-xs max-w-[240px]">
                Add products with barcodes, prices, and stock limits to enable POS sales.
              </p>
            </div>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                className="rounded-xl mt-2 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredProducts.map((product) => {
              const isConfirmingDelete = confirmDeleteId === product.id;
              const isLowStock = product.stock <= product.low_stock_threshold;

              return (
                <Card
                  key={product.id}
                  className={cn(
                    'p-3.5 flex items-center gap-3 rounded-2xl border transition-all bg-card shadow-2xs',
                    isConfirmingDelete ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'
                  )}
                >
                  {/* Favorite Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleFav(product)}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-90',
                      product.is_favorite
                        ? 'bg-warning/15 text-warning font-bold'
                        : 'bg-secondary/70 text-muted-foreground hover:text-warning'
                    )}
                    aria-label={product.is_favorite ? 'Remove favorite' : 'Add to favorites'}
                  >
                    <Star className={cn('h-4.5 w-4.5', product.is_favorite && 'fill-warning')} />
                  </button>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 select-text">
                    <div className="text-sm font-bold text-foreground truncate">
                      {product.name}
                    </div>

                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="font-extrabold text-primary tabular-nums">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className={cn('tabular-nums font-semibold', isLowStock ? 'text-destructive' : 'text-muted-foreground')}>
                        {product.stock} {product.unit} left
                      </span>
                    </div>

                    {product.barcode && (
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                        {product.barcode}
                      </div>
                    )}

                    {isConfirmingDelete && (
                      <span className="text-[11px] text-destructive font-medium block mt-1 animate-pulse">
                        Tap trash again to confirm delete
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="w-9 h-9 rounded-xl bg-secondary/80 hover:bg-secondary active:scale-90 transition-all flex items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(product.id, product.name)}
                      className={cn(
                        'w-9 h-9 rounded-xl transition-all flex items-center justify-center active:scale-90',
                        isConfirmingDelete
                          ? 'bg-destructive text-destructive-foreground animate-pulse shadow-xs'
                          : 'bg-secondary/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                      )}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Sheet */}
      {showForm && (
        <ProductForm
          product={editing}
          categories={categories || []}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={createProduct.isPending || updateProduct.isPending}
        />
      )}

      {/* Search by Barcode Scanner */}
      <Scanner
        open={scanSearchOpen}
        onClose={() => setScanSearchOpen(false)}
        onScan={(code) => {
          setSearch(code);
          setScanSearchOpen(false);
          toast.success(`Filter applied: ${code}`);
        }}
        title="Scan Barcode to Find"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRODUCT ADD/EDIT BOTTOM SHEET
// ─────────────────────────────────────────────────────────────
function ProductForm({
  product,
  categories,
  onSave,
  onClose,
  saving,
}: {
  product: Product | null;
  categories: { id: string; name: string }[];
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const isMobile = useIsMobile();
  const [name, setName] = useState(product?.name || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [cost, setCost] = useState(product?.cost?.toString() || '0');
  const [stock, setStock] = useState(product?.stock?.toString() || '0');
  const [unit, setUnit] = useState(product?.unit || 'pc');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [lowStock, setLowStock] = useState(product?.low_stock_threshold?.toString() || '5');
  const [scanOpen, setScanOpen] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    onSave({
      name: name.trim(),
      barcode: barcode.trim() || null,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      stock: parseInt(stock) || 0,
      unit: unit.trim() || 'pc',
      category_id: categoryId || null,
      low_stock_threshold: parseInt(lowStock) || 5,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-card w-full sm:max-w-md flex flex-col overflow-hidden shadow-2xl transition-all',
          isMobile
            ? 'rounded-t-3xl max-h-[92dvh] pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
            : 'rounded-2xl max-h-[88vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-2.5 shrink-0" />
        )}

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <h2 className="font-bold text-base text-foreground">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 flex-1 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Product Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Coca-Cola 500ml, Lucky Me Pancit Canton"
              autoFocus
              className="h-11 text-base rounded-xl font-medium"
            />
          </div>

          {/* Barcode with camera scan button */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Barcode / SKU
            </label>
            <div className="flex gap-2">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or type barcode"
                className="flex-1 h-11 text-base font-mono rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setScanOpen(true)}
                className="h-11 px-3.5 rounded-xl shrink-0 active:scale-95"
                title="Scan with camera"
              >
                <Camera className="h-4 w-4 mr-1.5" />
                Scan
              </Button>
            </div>
          </div>

          {/* Pricing: Retail & Unit Cost */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Selling Price (PHP) *
              </label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                className="h-11 text-base font-bold font-mono rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Cost Price (PHP)
              </label>
              <Input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                className="h-11 text-base font-bold font-mono rounded-xl"
              />
            </div>
          </div>

          {/* Stock, Unit & Threshold */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Stock Qty
              </label>
              <Input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                type="number"
                inputMode="numeric"
                className="h-11 text-base font-bold font-mono rounded-xl text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Unit
              </label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pc"
                className="h-11 text-base rounded-xl text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Low Alert
              </label>
              <Input
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
                type="number"
                inputMode="numeric"
                className="h-11 text-base font-bold font-mono rounded-xl text-center"
              />
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="">No category (Unassigned)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex-1 h-12 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99]"
          >
            {saving ? 'Saving...' : (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Save Product
              </span>
            )}
          </Button>
        </div>

        {/* Camera Scanner Modal for Form Barcode */}
        <Scanner
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScan={(code) => {
            setBarcode(code);
            setScanOpen(false);
            toast.success(`Captured: ${code}`);
          }}
          title="Scan Product Barcode"
        />
      </div>
    </div>
  );
}