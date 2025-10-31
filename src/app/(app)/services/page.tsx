'use client';

import { useState } from 'react';
import { PlusCircle, Trash2, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServiceItem {
  id: string;
  name: string;
  type: string;
  typeLabel?: string;
  categoryId?: string;
  categoryName?: string;
  price: number;
  image?: string;
  description?: string;
  createdAt: string;
}

export default function ServicesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    categoryId: '',
    price: '',
    image: '',
    description: '',
  });

  const firestore = useFirestore();

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'services');
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const serviceTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'serviceTypes');
  }, [firestore]);

  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: categories, isLoading: isLoadingCategories } = useCollection(categoriesQuery);
  const { data: serviceTypes, isLoading: isLoadingServiceTypes } = useCollection(serviceTypesQuery);

  const filteredServices = services?.filter((service: any) =>
    service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      categoryId: '',
      price: '',
      image: '',
      description: '',
    });
  };

  const handleAddClick = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (service: any) => {
    setSelectedItem(service);
    setFormData({
      name: service.name || '',
      type: service.type || '',
      categoryId: service.categoryId || '',
      price: service.price?.toString() || '',
      image: service.image || '',
      description: service.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (service: any) => {
    setSelectedItem(service);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!firestore || !formData.name || !formData.price || !formData.categoryId || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const servicesRef = collection(firestore, 'services');

      // Find category name and type label
      const category = categories?.find((c: any) => c.id === formData.categoryId);
      const serviceType = serviceTypes?.find((t: any) => t.id === formData.type);

      await addDoc(servicesRef, {
        name: formData.name,
        type: formData.type,
        typeLabel: serviceType?.name || '',
        categoryId: formData.categoryId,
        categoryName: category?.name || '',
        price: parseFloat(formData.price),
        image: formData.image || '',
        description: formData.description || '',
        createdAt: new Date().toISOString(),
      });

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!firestore || !selectedItem || !formData.name || !formData.price || !formData.categoryId || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const serviceRef = doc(firestore, 'services', selectedItem.id);

      // Find category name and type label
      const category = categories?.find((c: any) => c.id === formData.categoryId);
      const serviceType = serviceTypes?.find((t: any) => t.id === formData.type);

      await updateDoc(serviceRef, {
        name: formData.name,
        type: formData.type,
        typeLabel: serviceType?.name || '',
        categoryId: formData.categoryId,
        categoryName: category?.name || '',
        price: parseFloat(formData.price),
        image: formData.image || '',
        description: formData.description || '',
        updatedAt: new Date().toISOString(),
      });

      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!firestore || !selectedItem) {
      return;
    }

    setIsDeleting(true);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const serviceRef = doc(firestore, 'services', selectedItem.id);

      await deleteDoc(serviceRef);

      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickAddCategory = async () => {
    if (!firestore || !newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    setIsAddingCategory(true);
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const categoriesRef = collection(firestore, 'categories');

      const docRef = await addDoc(categoriesRef, {
        name: newCategoryName.trim(),
        createdAt: new Date().toISOString(),
      });

      // Auto-select the newly created category
      setFormData({ ...formData, categoryId: docRef.id });
      setNewCategoryName('');
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleQuickAddType = async () => {
    if (!firestore || !newTypeName.trim()) {
      alert('Please enter a type name');
      return;
    }

    setIsAddingType(true);
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const serviceTypesRef = collection(firestore, 'serviceTypes');

      const docRef = await addDoc(serviceTypesRef, {
        name: newTypeName.trim(),
        createdAt: new Date().toISOString(),
      });

      // Auto-select the newly created type
      setFormData({ ...formData, type: docRef.id });
      setNewTypeName('');
      setIsAddTypeDialogOpen(false);
    } catch (error) {
      console.error('Error adding type:', error);
      alert('Failed to add type. Please try again.');
    } finally {
      setIsAddingType(false);
    }
  };

  const getTypeBadgeColor = (typeId: string) => {
    // Hash the type ID to generate a consistent color
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800',
      'bg-teal-100 text-teal-800',
    ];
    
    // Simple hash function to get consistent color for each type
    let hash = 0;
    for (let i = 0; i < typeId.length; i++) {
      hash = typeId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Services & Non-Inventory Items</h1>
            <p className="text-muted-foreground">
              Manage services, wireless prepaid, and other items without inventory tracking
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Services Table */}
        <div className="border rounded-lg bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2">Description</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Service Rows */}
          <div>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 border-b">
                  <div className="col-span-12">
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))
            )}

            {!isLoading && filteredServices?.map((service: any) => (
              <div
                key={service.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-muted/50"
              >
                <div className="col-span-3 font-medium">{service.name}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{service.categoryName || '—'}</div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeColor(service.type)}`}>
                    {service.typeLabel || '—'}
                  </span>
                </div>
                <div className="col-span-2 text-right">${(service.price || 0).toFixed(2)}</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {service.description || '—'}
                </div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(service)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {!isLoading && filteredServices?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                No services found. Add one to get started.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            Total: {filteredServices?.length || 0} service(s)
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>
              Add a new service or non-inventory item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phone Repair, $50 Prepaid Card"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setIsAddCategoryDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Quick Add Category
              </Button>
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setIsAddTypeDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Quick Add Type
              </Button>
            </div>

            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phone Repair, $50 Prepaid Card"
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setIsAddCategoryDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Quick Add Category
              </Button>
            </div>

            <div>
              <Label htmlFor="edit-type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setIsAddTypeDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Quick Add Type
              </Button>
            </div>

            <div>
              <Label htmlFor="edit-price">Price *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Category</DialogTitle>
            <DialogDescription>
              Create a new category for your services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-category">Category Name *</Label>
              <Input
                id="new-category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Phone Services, Wireless Plans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddCategory();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddCategoryDialogOpen(false);
                setNewCategoryName('');
              }} 
              disabled={isAddingCategory}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickAddCategory} disabled={isAddingCategory || !newCategoryName.trim()}>
              {isAddingCategory ? 'Adding...' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Type Dialog */}
      <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Type</DialogTitle>
            <DialogDescription>
              Create a new service type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-type">Type Name *</Label>
              <Input
                id="new-type"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., Phone Repair, SIM Card Activation, Bill Payment"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddType();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddTypeDialogOpen(false);
                setNewTypeName('');
              }} 
              disabled={isAddingType}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickAddType} disabled={isAddingType || !newTypeName.trim()}>
              {isAddingType ? 'Adding...' : 'Add Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
