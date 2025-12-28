'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiClient, EquipmentCategory, EquipmentCondition } from '@innozverse/api-client';
import { Loader2 } from 'lucide-react';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

const CATEGORIES: EquipmentCategory[] = [
  'laptop',
  'desktop',
  'monitor',
  'keyboard',
  'mouse',
  'headset',
  'gaming_console',
  'controller',
  'peripheral',
];

const CONDITION_OPTIONS: EquipmentCondition[] = ['excellent', 'good', 'fair'];

export interface EquipmentFormData {
  name: string;
  description: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serial_number: string;
  daily_rate: string;
  image_url: string;
  condition: EquipmentCondition;
  notes: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  category: EquipmentCategory;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  daily_rate: string;
  image_url: string | null;
  specs: Record<string, string | number | boolean> | null;
  status: string;
  condition: EquipmentCondition;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | null;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const initialFormData: EquipmentFormData = {
  name: '',
  description: '',
  category: 'laptop',
  brand: '',
  model: '',
  serial_number: '',
  daily_rate: '',
  image_url: '',
  condition: 'excellent',
  notes: '',
};

export function EquipmentDialog({
  open,
  onOpenChange,
  equipment,
  onSuccess,
  onError,
}: EquipmentDialogProps) {
  const [formData, setFormData] = useState<EquipmentFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const isEditing = !!equipment;

  // Reset form when dialog opens/closes or equipment changes
  useEffect(() => {
    if (open) {
      if (equipment) {
        setFormData({
          name: equipment.name,
          description: equipment.description || '',
          category: equipment.category,
          brand: equipment.brand || '',
          model: equipment.model || '',
          serial_number: equipment.serial_number || '',
          daily_rate: equipment.daily_rate,
          image_url: equipment.image_url || '',
          condition: equipment.condition,
          notes: equipment.notes || '',
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, equipment]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.daily_rate) {
      onError('Name and Daily Rate are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serial_number: formData.serial_number || undefined,
        daily_rate: parseFloat(formData.daily_rate),
        image_url: formData.image_url || undefined,
        condition: formData.condition,
        notes: formData.notes || undefined,
      };

      if (isEditing && equipment) {
        await apiClient.updateEquipment(equipment.id, payload);
      } else {
        await apiClient.createEquipment(payload);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update equipment information' : 'Add new equipment to inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="MacBook Pro 16-inch"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Brand</label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Apple"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Model</label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="M3 Pro"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Daily Rate *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                placeholder="50.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as EquipmentCondition })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CONDITION_OPTIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Serial Number</label>
            <Input
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="ABC123XYZ"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Equipment description..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes..."
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.daily_rate || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
