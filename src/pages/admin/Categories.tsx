import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Tags, Check } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useProducts';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Category } from '@/types';

export function Categories() {
  const isMobile = useIsMobile();
  const { data: categories, isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isPending = createCat.isPending || updateCat.isPending;

  const triggerHaptic = (ms = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setShowForm(true);
    triggerHaptic(15);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setShowForm(true);
    triggerHaptic(15);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || isPending) return;

    try {
      if (editing) {
        await updateCat.mutateAsync({ id: editing.id, name: trimmed });
        toast.success(`Updated "${trimmed}"`);
      } else {
        await createCat.mutateAsync(trimmed);
        toast.success(`Category "${trimmed}" added`);
      }
      setShowForm(false);
      setEditing(null);
      setName('');
      triggerHaptic(30);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      triggerHaptic(20);
      return;
    }

    try {
      await deleteCat.mutateAsync(id);
      setConfirmDeleteId(null);
      triggerHaptic(30);
      toast.info(`Deleted "${catName}"`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Categories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {categories?.length || 0} active {categories?.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="h-11 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            Loading categories...
          </div>
        ) : (categories || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/60">
              <Tags className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No categories yet</p>
              <p className="text-xs max-w-[240px]">
                Group your sari-sari items (e.g., Canned Goods, Beverages, Snacks) for faster sales lookup.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              className="rounded-xl mt-2 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(categories || []).map((cat) => {
              const isConfirmingDelete = confirmDeleteId === cat.id;

              return (
                <Card
                  key={cat.id}
                  className={cn(
                    'p-3.5 flex items-center justify-between gap-3 rounded-2xl border transition-all bg-card shadow-2xs',
                    isConfirmingDelete ? 'border-destructive ring-1 ring-destructive/30' : 'border-border'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {cat.name}
                    </div>
                    {isConfirmingDelete && (
                      <span className="text-[11px] text-destructive font-medium block mt-0.5 animate-pulse">
                        Tap trash again to confirm delete
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary active:scale-90 transition-all flex items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className={cn(
                        'w-10 h-10 rounded-xl transition-all flex items-center justify-center active:scale-90',
                        isConfirmingDelete
                          ? 'bg-destructive text-destructive-foreground animate-pulse shadow-xs'
                          : 'bg-secondary/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                      )}
                      aria-label={`Delete ${cat.name}`}
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

      {/* Responsive Bottom Sheet / Modal for Create & Edit */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-150"
          onClick={() => setShowForm(false)}
        >
          <div
            className={cn(
              'bg-card w-full sm:max-w-sm flex flex-col overflow-hidden shadow-2xl transition-all',
              isMobile
                ? 'rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200'
                : 'rounded-2xl'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle for mobile */}
            {isMobile && (
              <div className="w-12 h-1 bg-muted-foreground/25 rounded-full mx-auto mt-2.5 shrink-0" />
            )}

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
              <h2 className="font-bold text-base text-foreground">
                {editing ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Category Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Beverages, Instant Noodles..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  /* text-base prevents iOS Safari zoom */
                  className="h-12 text-base rounded-xl font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-12 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim() || isPending}
                  className="flex-1 h-12 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99]"
                >
                  {isPending ? 'Saving...' : (
                    <span className="flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      Save
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}