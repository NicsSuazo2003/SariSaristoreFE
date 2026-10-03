import { useState } from 'react';
import { Plus, Search, Star, Pencil, Trash2, X, Camera } from 'lucide-react';
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, useToggleFavorite } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Scanner } from '@/components/pos/ScannerModal';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function Products() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products, isLoading } = useProducts({ search: search || undefined });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const toggleFavorite = useToggleFavorite();

  const handleSave = async (data: Partial<Product>) => {
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...data });
        toast.success('Product updated');
      } else {
        await createProduct.mutateAsync(data);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.info('Product deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleToggleFav = async (p: Product) => {
    try {
      await toggleFavorite.mutateAsync({ id: p.id, isFavorite: !p.is_favorite });
    } catch (e: any) {
      toast.error('Failed to toggle favorite');
    }
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{products?.length || 0} items</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (products || []).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">No products yet.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add your first product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(products || []).map((product) => (
            <Card key={product.id} className="p-3 flex items-center gap-3">
              <button
                onClick={() => handleToggleFav(product)}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  product.is_favorite ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground hover:text-warning'
                )}
              >
                <Star className={cn('h-4 w-4', product.is_favorite && 'fill-warning')} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{product.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(product.price)} · {product.stock} {product.unit} in stock
                </div>
                {product.barcode && (
                  <div className="text-[10px] text-muted-foreground font-mono">{product.barcode}</div>
                )}
              </div>
              <button
                onClick={() => { setEditing(product); setShowForm(true); }}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories || []}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={createProduct.isPending || updateProduct.isPending}
        />
      )}
    </div>
  );
}

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
      unit,
      category_id: categoryId || null,
      low_stock_threshold: parseInt(lowStock) || 5,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" autoFocus />
          </div>

          {/* Barcode with scan button */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Barcode</label>
            <div className="flex gap-2">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barcode (optional)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setScanOpen(true)}
                aria-label="Scan barcode"
                className="shrink-0 h-9 w-9"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Tap the camera to scan, or type the barcode manually
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Price (PHP)</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" inputMode="decimal" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cost (PHP)</label>
              <Input value={cost} onChange={(e) => setCost(e.target.value)} type="number" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Stock</label>
              <Input value={stock} onChange={(e) => setStock(e.target.value)} type="number" inputMode="numeric" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Unit</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pc" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Low Stock</label>
              <Input value={lowStock} onChange={(e) => setLowStock(e.target.value)} type="number" inputMode="numeric" placeholder="5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Barcode scanner modal */}
        <Scanner
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScan={(code) => {
            setBarcode(code);
            setScanOpen(false);
            toast.success(`Barcode captured: ${code}`);
          }}
          title="Scan Product Barcode"
        />
      </div>
    </div>
  );
}