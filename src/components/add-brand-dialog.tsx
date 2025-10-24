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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';

const addBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required.'),
  description: z.string().optional(),
});

type AddBrandFormValues = z.infer<typeof addBrandSchema>;

interface AddBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBrandDialog({ open, onOpenChange }: AddBrandDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<AddBrandFormValues>({
    resolver: zodResolver(addBrandSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: AddBrandFormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    try {
      const brandsCollection = collection(firestore, 'brands');
      await addDoc(brandsCollection, {
        name: values.name,
        description: values.description || '',
        createdAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Brand Added',
        description: `Brand "${values.name}" has been successfully created.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding brand:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add brand. Please try again.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
          <DialogDescription>
            Create a new brand to categorize products by manufacturer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Coca-Cola" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leading beverage manufacturer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Add Brand</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
