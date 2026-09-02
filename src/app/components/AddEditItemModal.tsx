'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Sparkles } from 'lucide-react';
import { InventoryItem, Category, Location, Unit, suggestCategory,  } from '@/lib/store';

const UNITS: Unit[] = ['kg', 'g', 'litre', 'ml', 'pieces', 'packets', 'boxes', 'bottles', 'cans', 'dozen', 'packs', 'rolls', 'tubes', 'other'];

interface FormValues {
  name: string;
  categoryId: string;
  locationId: string;
  quantity: number;
  unit: Unit;
  minQuantity: number;
  notes: string;
}

interface AddEditItemModalProps {
  isOpen: boolean;
  editItem: InventoryItem | null;
  categories: Category[];
  locations: Location[];
  onClose: () => void;
  onSave: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddCategory: (name: string) => Category;
  onAddLocation: (name: string) => Location;
}

export default function AddEditItemModal({
  isOpen, editItem, categories, locations,
  onClose, onSave, onAddCategory, onAddLocation,
}: AddEditItemModalProps) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [categorySuggested, setCategorySuggested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      name: '', categoryId: '', locationId: '',
      quantity: 0, unit: 'kg', minQuantity: 1, notes: '',
    },
  });

  const watchedName = watch('name');

  // Auto-suggest category on name change
  useEffect(() => {
    if (!editItem && watchedName && watchedName.length > 2) {
      const suggested = suggestCategory(watchedName);
      setValue('categoryId', suggested);
      setCategorySuggested(true);
    }
  }, [watchedName, editItem, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      reset({
        name: editItem.name,
        categoryId: editItem.categoryId,
        locationId: editItem.locationId,
        quantity: editItem.quantity,
        unit: editItem.unit,
        minQuantity: editItem.minQuantity,
        notes: editItem.notes,
      });
      setCategorySuggested(false);
    } else {
      reset({ name: '', categoryId: '', locationId: '', quantity: 0, unit: 'kg', minQuantity: 1, notes: '' });
      setCategorySuggested(false);
    }
  }, [editItem, reset, isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = onAddCategory(newCategoryName.trim());
    setValue('categoryId', cat.id);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    const loc = onAddLocation(newLocationName.trim());
    setValue('locationId', loc.id);
    setNewLocationName('');
    setShowNewLocation(false);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 400));
    onSave(data);
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    reset();
    setShowNewCategory(false);
    setShowNewLocation(false);
    setNewCategoryName('');
    setNewLocationName('');
    onClose();
  };

  const watchedCategoryId = watch('categoryId');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={handleClose}
    >
      <div
        className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-modal modal-content max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card flex items-center justify-between px-6 pt-6 pb-4 border-b border-border z-10">
          <h3 className="text-lg font-semibold text-foreground">
            {editItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button onClick={handleClose} className="p-2 rounded-lg btn-ghost text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Item Name <span className="text-status-outofstock">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Toor Dal, Shampoo, Diapers"
              className={`w-full h-10 px-3 input-base text-sm ${errors.name ? 'input-error' : ''}`}
              {...register('name', { required: 'Item name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
            />
            {errors.name && <p className="text-xs text-status-outofstock mt-1">{errors.name.message}</p>}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground">
                Category <span className="text-status-outofstock">*</span>
              </label>
              {categorySuggested && !editItem && (
                <span className="inline-flex items-center gap-1 text-2xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  Auto-suggested
                </span>
              )}
            </div>
            <select
              className={`w-full h-10 px-3 input-base text-sm ${errors.categoryId ? 'input-error' : ''}`}
              {...register('categoryId', { required: 'Category is required' })}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={`cat-opt-${cat.id}`} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-status-outofstock mt-1">{errors.categoryId.message}</p>}

            {!showNewCategory ? (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="mt-2 text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add New Category
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 h-9 px-3 input-base text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 h-9 rounded-lg btn-primary text-xs font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                  className="px-3 h-9 rounded-lg border border-border text-xs btn-ghost"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Available Qty <span className="text-status-outofstock">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                className={`w-full h-10 px-3 input-base text-sm font-tabular ${errors.quantity ? 'input-error' : ''}`}
                {...register('quantity', {
                  required: 'Required',
                  min: { value: 0, message: 'Cannot be negative' },
                  valueAsNumber: true,
                })}
              />
              {errors.quantity && <p className="text-xs text-status-outofstock mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Unit</label>
              <select
                className="w-full h-10 px-3 input-base text-sm"
                {...register('unit')}
              >
                {UNITS.map(u => (
                  <option key={`unit-${u}`} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Minimum Quantity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Minimum Quantity <span className="text-status-outofstock">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-1.5">
              Item will be marked Low Stock when quantity reaches this level
            </p>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="1"
              className={`w-full h-10 px-3 input-base text-sm font-tabular ${errors.minQuantity ? 'input-error' : ''}`}
              {...register('minQuantity', {
                required: 'Required',
                min: { value: 0, message: 'Cannot be negative' },
                valueAsNumber: true,
              })}
            />
            {errors.minQuantity && <p className="text-xs text-status-outofstock mt-1">{errors.minQuantity.message}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Storage Location <span className="text-status-outofstock">*</span>
            </label>
            <select
              className={`w-full h-10 px-3 input-base text-sm ${errors.locationId ? 'input-error' : ''}`}
              {...register('locationId', { required: 'Location is required' })}
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={`loc-opt-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {errors.locationId && <p className="text-xs text-status-outofstock mt-1">{errors.locationId.message}</p>}

            {!showNewLocation ? (
              <button
                type="button"
                onClick={() => setShowNewLocation(true)}
                className="mt-2 text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> Add New Location
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newLocationName}
                  onChange={e => setNewLocationName(e.target.value)}
                  placeholder="Location name"
                  className="flex-1 h-9 px-3 input-base text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="px-3 h-9 rounded-lg btn-primary text-xs font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewLocation(false); setNewLocationName(''); }}
                  className="px-3 h-9 rounded-lg border border-border text-xs btn-ghost"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Brand preference, pack size, etc."
              className="w-full px-3 py-2 input-base text-sm resize-none"
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : (editItem ? 'Save Changes' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
