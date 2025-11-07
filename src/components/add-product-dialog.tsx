
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, PlusCircle, Trash2, Diamond } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { AddAttributeDialog } from './add-attribute-dialog';
import { AddUnitDialog } from './add-unit-dialog';
import { AddCategoryDialog } from './add-category-dialog';
import { AddBrandDialog } from './add-brand-dialog';
import { SetupUnitsAttributesDialog } from './setup-units-attributes-dialog';

const addProductSchema = z.object({
  productNumber: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Product name is required.'),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  costPrice: z.coerce.number().optional(),
  sellingPrice: z.coerce.number().optional(),
  manageByLot: z.enum(["yes", "no"]).default("no"),
  onHand: z.coerce.number().optional(),
  minInventory: z.coerce.number().optional(),
  maxInventory: z.coerce.number().optional(),
  position: z.string().optional(),
  weight: z.coerce.number().optional(),
  weightUnit: z.string().default("g"),
  forSale: z.boolean().default(true),
  attributes: z.array(
    z.object({
      key: z.string().min(1, 'Attribute name is required.'),
      value: z.string().min(1, 'Attribute value is required.'),
    })
  ).optional(),
});

type AddProductFormValues = z.infer<typeof addProductSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode?: boolean;
  productToEdit?: any;
}

export function AddProductDialog({ open, onOpenChange, editMode = false, productToEdit }: AddProductDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  
  // State for opening modals
  const [isAddAttributeOpen, setIsAddAttributeOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isSetupUnitsAttributesOpen, setIsSetupUnitsAttributesOpen] = useState(false);

  // Fetch attributes from Firestore (for position attribute)
  const { data: positionData } = useDoc(useMemoFirebase(() => firestore ? doc(firestore, 'productAttributes', 'position') : null, [firestore]));
  
  // Fetch categories and brands from their own collections
  const { data: categories } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]));
  const { data: brands } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'brands') : null, [firestore]));
  
  // Fetch units from Firestore
  const { data: weightUnits } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'units') : null, [firestore]));

  const positions = positionData?.values || [];


  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: editMode && productToEdit ? {
      productNumber: productToEdit.productNumber || '',
      barcode: productToEdit.barcode || '',
      name: productToEdit.name || '',
      description: productToEdit.description || '',
      category: productToEdit.category || '',
      brand: productToEdit.brand || '',
      costPrice: productToEdit.costPrice || 0,
      sellingPrice: productToEdit.sellingPrice || 0,
      manageByLot: productToEdit.manageByLot || 'no',
      onHand: productToEdit.onHand || 0,
      minInventory: productToEdit.minInventory || 0,
      maxInventory: productToEdit.maxInventory || 999999999,
      position: productToEdit.position || '',
      weight: productToEdit.weight || 0,
      weightUnit: productToEdit.weightUnit || 'g',
      forSale: productToEdit.forSale !== false,
      attributes: productToEdit.attributes || [],
    } : {
      name: '',
      description: '',
      barcode: '',
      attributes: [],
      manageByLot: 'no',
      onHand: 0,
      minInventory: 0,
      maxInventory: 999999999,
      costPrice: 0,
      sellingPrice: 0,
      weight: 0,
      weightUnit: 'g',
      forSale: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attributes',
  });

  // Reset form when opening in edit mode
  useEffect(() => {
    if (open && editMode && productToEdit) {
      form.reset({
        productNumber: productToEdit.productNumber || '',
        barcode: productToEdit.barcode || '',
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        category: productToEdit.category || '',
        brand: productToEdit.brand || '',
        costPrice: productToEdit.costPrice || 0,
        sellingPrice: productToEdit.sellingPrice || 0,
        manageByLot: productToEdit.manageByLot || 'no',
        onHand: productToEdit.onHand || 0,
        minInventory: productToEdit.minInventory || 0,
        maxInventory: productToEdit.maxInventory || 999999999,
        position: productToEdit.position || '',
        weight: productToEdit.weight || 0,
        weightUnit: productToEdit.weightUnit || 'g',
        forSale: productToEdit.forSale !== false,
        attributes: productToEdit.attributes || [],
      });
    } else if (open && !editMode) {
      // Reset to empty form for add mode
      form.reset({
        name: '',
        description: '',
        barcode: '',
        productNumber: '',
        category: '',
        brand: '',
        attributes: [],
        manageByLot: 'no',
        onHand: 0,
        minInventory: 0,
        maxInventory: 999999999,
        costPrice: 0,
        sellingPrice: 0,
        weight: 0,
        weightUnit: 'g',
        forSale: true,
      });
    }
  }, [open, editMode, productToEdit, form]);

  async function onSubmit(values: AddProductFormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    try {
      // Clean up the data - remove undefined/null values and empty arrays
      const cleanData: any = {
        name: values.name,
        forSale: values.forSale ?? true,
        manageByLot: values.manageByLot || 'no',
      };

      // Only add optional fields if they have values
      if (values.productNumber) cleanData.productNumber = values.productNumber;
      if (values.barcode) cleanData.barcode = values.barcode;
      if (values.description) cleanData.description = values.description;
      if (values.category) cleanData.category = values.category;
      if (values.brand) cleanData.brand = values.brand;
      if (values.position) cleanData.position = values.position;
      
      // Add numeric fields (use 0 as default if not provided)
      cleanData.costPrice = values.costPrice || 0;
      cleanData.sellingPrice = values.sellingPrice || 0;
      cleanData.onHand = values.onHand || 0;
      cleanData.minInventory = values.minInventory || 0;
      cleanData.maxInventory = values.maxInventory || 0;
      cleanData.weight = values.weight || 0;
      cleanData.weightUnit = values.weightUnit || 'g';

      // Only add attributes if there are valid ones
      if (values.attributes && values.attributes.length > 0) {
        const validAttributes = values.attributes.filter(
          attr => attr.key && attr.value
        );
        if (validAttributes.length > 0) {
          cleanData.attributes = validAttributes;
        }
      }

      if (editMode && productToEdit) {
        // Update existing product
        const productRef = doc(firestore, 'products', productToEdit.id);
        cleanData.updatedAt = new Date().toISOString();
        await updateDoc(productRef, cleanData);
        
        toast({
          title: 'Product Updated',
          description: `Product "${values.name}" has been successfully updated.`,
        });
      } else {
        // Add new product
        cleanData.createdAt = new Date().toISOString();
        const productsCollection = collection(firestore, 'products');
        await addDoc(productsCollection, cleanData);
        
        toast({
          title: 'Product Added',
          description: `Product "${values.name}" has been successfully created.`,
        });
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add product. Please try again.',
      });
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>{editMode ? 'Edit product' : 'Create product'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-6 py-4">
                    <Tabs defaultValue="details">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="description">Description</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="space-y-6 py-4">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                      control={form.control}
                                      name="productNumber"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Product number</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Auto-generated" {...field} disabled />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="barcode"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Barcode</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Enter barcode" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Product name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Required" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                      control={form.control}
                                      name="category"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Category</FormLabel>
                                          <div className='flex items-center gap-2'>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {categories && categories.length > 0 ? (
                                                categories.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                                              ) : (
                                                <div 
                                                  className="p-2 text-sm text-muted-foreground hover:text-primary cursor-pointer hover:bg-muted"
                                                  onClick={() => {
                                                    onOpenChange(false);
                                                    router.push('/settings');
                                                  }}
                                                >
                                                  No categories. Click to add in Settings →
                                                </div>
                                              )}
                                            </SelectContent>
                                          </Select>
                                          <Button 
                                            type="button" 
                                            variant="link" 
                                            className="p-0 h-auto" 
                                            onClick={() => setIsAddCategoryOpen(true)}
                                          >
                                            Add
                                          </Button>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="brand"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Brand</FormLabel>
                                          <div className='flex items-center gap-2'>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select brand" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                {brands && brands.length > 0 ? (
                                                  brands.map((b: any) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)
                                                ) : (
                                                  <div 
                                                    className="p-2 text-sm text-muted-foreground hover:text-primary cursor-pointer hover:bg-muted"
                                                    onClick={() => {
                                                      onOpenChange(false);
                                                      router.push('/settings');
                                                    }}
                                                  >
                                                    No brands. Click to add in Settings →
                                                  </div>
                                                )}
                                              </SelectContent>
                                            </Select>
                                            <Button 
                                              type="button" 
                                              variant="link" 
                                              className="p-0 h-auto" 
                                              onClick={() => setIsAddBrandOpen(true)}
                                            >
                                              Add
                                            </Button>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <FormLabel>Add image</FormLabel>
                                <div className="mt-2 flex justify-center items-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                    <div className="text-center">
                                        <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Add image</p>
                                        <p className="text-xs text-muted-foreground">Up to 2 MB per image</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cost price, sold price</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="costPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Cost price</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sellingPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Selling price</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="number" className="pr-20" {...field} />
                                            </FormControl>
                                            <Button variant="link" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
                                                <Diamond className="w-3 h-3 mr-1"/>
                                                Price book
                                            </Button>
                                        </div>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Onhand</CardTitle>
                                <CardDescription>Manage on-hand quantity and inventory levels. When the on-hand quantity reaches the inventory level, you will receive a notification.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="manageByLot"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Manage by lot, expiry date</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="no">No</SelectItem>
                                                <SelectItem value="yes">Yes</SelectItem>
                                            </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="onHand" render={({ field }) => (
                                    <FormItem><FormLabel>On hand</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="minInventory" render={({ field }) => (
                                    <FormItem><FormLabel>Min. inventory level</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="maxInventory" render={({ field }) => (
                                    <FormItem><FormLabel>Max. inventory level</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Location, weight</CardTitle>
                                <CardDescription>Manage warehouse arrangement, sales position, or product weight</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                              <FormField
                                  control={form.control}
                                  name="position"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Position</FormLabel>
                                      <div className='flex items-center gap-2'>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select position" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {positions.length > 0 ? (
                                            positions.map((p: any) => <SelectItem key={p} value={p}>{p}</SelectItem>)
                                          ) : (
                                            <div 
                                              className="p-2 text-sm text-muted-foreground hover:text-primary cursor-pointer hover:bg-muted"
                                              onClick={() => {
                                                onOpenChange(false);
                                                router.push('/settings');
                                              }}
                                            >
                                              No positions. Click to add in Settings →
                                            </div>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        type="button" 
                                        variant="link" 
                                        className="p-0 h-auto" 
                                        onClick={() => setIsAddAttributeOpen(true)}
                                      >
                                        Add
                                      </Button>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                        <div className="flex items-center justify-between mb-2">
                                          <FormLabel>Weight</FormLabel>
                                          <Button 
                                            type="button" 
                                            variant="link" 
                                            className="p-0 h-auto text-xs" 
                                            onClick={() => setIsAddUnitOpen(true)}
                                          >
                                            Add Unit
                                          </Button>
                                        </div>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="number" className="pr-20" {...field} />
                                            </FormControl>
                                            <FormField
                                                control={form.control}
                                                name="weightUnit"
                                                render={({ field: selectField }) => (
                                                <Select onValueChange={selectField.onChange} value={selectField.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="absolute right-1 top-1/2 -translate-y-1/2 w-16 h-8 border-none bg-transparent">
                                                            <SelectValue placeholder="Unit" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {weightUnits && weightUnits.length > 0 ? (
                                                          weightUnits.map((u: any) => <SelectItem key={u.id} value={u.abbreviation}>{u.abbreviation}</SelectItem>)
                                                        ) : (
                                                          <div 
                                                            className="p-2 text-sm text-muted-foreground hover:text-primary cursor-pointer hover:bg-muted"
                                                            onClick={() => {
                                                              onOpenChange(false);
                                                              router.push('/settings');
                                                            }}
                                                          >
                                                            No units. Click to add in Settings →
                                                          </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                )}
                                            />
                                        </div>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Manage by units and attributes</CardTitle>
                                <CardDescription>Create multiple products with different units (bottle, pack, box) or attributes (flavor, volume, color). Each product has a unique product number.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setIsSetupUnitsAttributesOpen(true)}
                                >
                                    Set up
                                </Button>
                                
                                {/* Display selected attributes */}
                                {fields.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    {fields.map((field, index) => (
                                      <div key={field.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                                        <span className="flex-1">
                                          <strong>{form.watch(`attributes.${index}.key`)}:</strong> {form.watch(`attributes.${index}.value`)}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => remove(index)}
                                          className="h-6 w-6"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </CardContent>
                        </Card>

                      </TabsContent>
                      <TabsContent value="description" className="py-4">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter a detailed description of the product."
                                        className="min-h-[400px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
            </div>
            <DialogFooter className="border-t p-6 mt-auto">
                <div className="flex items-center justify-between w-full">
                    <FormField
                        control={form.control}
                        name="forSale"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel>For sale</FormLabel>
                            </FormItem>
                        )}
                    />
                    <div className="flex items-center gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                            Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">{editMode ? 'Update' : 'Save'}</Button>
                    </div>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <AddAttributeDialog 
      open={isAddAttributeOpen} 
      onOpenChange={setIsAddAttributeOpen}
    />
    <AddUnitDialog 
      open={isAddUnitOpen} 
      onOpenChange={setIsAddUnitOpen}
    />
    <AddCategoryDialog 
      open={isAddCategoryOpen} 
      onOpenChange={setIsAddCategoryOpen}
    />
    <AddBrandDialog 
      open={isAddBrandOpen} 
      onOpenChange={setIsAddBrandOpen}
    />
    <SetupUnitsAttributesDialog
      open={isSetupUnitsAttributesOpen}
      onOpenChange={setIsSetupUnitsAttributesOpen}
      onSave={(data) => {
        // Clear existing attributes
        while (fields.length > 0) {
          remove(0);
        }
        // Add new attributes
        data.forEach((pair: any) => {
          append({ key: pair.attribute, value: pair.value });
        });
      }}
    />
    </>
  );
}

    