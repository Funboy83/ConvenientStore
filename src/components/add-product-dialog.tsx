
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { addProduct } from '@/app/(app)/products/actions';

const addProductSchema = z.object({
  name: z.string().min(1, 'Product name is required.'),
  description: z.string().min(1, 'Description is required.'),
  barcode: z.string().min(1, 'Barcode is required.'),
  attributes: z.array(
    z.object({
      key: z.string().min(1, 'Attribute name is required.'),
      value: z.string().min(1, 'Attribute value is required.'),
    })
  ),
});

type AddProductFormValues = z.infer<typeof addProductSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const { toast } = useToast();
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      description: '',
      barcode: '',
      attributes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attributes',
  });

  async function onSubmit(values: AddProductFormValues) {
    try {
      await addProduct(values);
      toast({
        title: 'Product Added',
        description: `Product "${values.name}" has been successfully created.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add product. Please try again.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details for the new product.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Premium Coffee Beans" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rich and aromatic beans" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input placeholder="e.g., 123456789012" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Attributes</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`attributes.${index}.key`}
                      render={({ field }) => (
                         <FormItem className="flex-1">
                           <FormControl>
                             <Input placeholder="Attribute" {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`attributes.${index}.value`}
                      render={({ field }) => (
                         <FormItem className="flex-1">
                            <FormControl>
                             <Input placeholder="Value" {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ key: '', value: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Attribute
                </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Create Product</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
