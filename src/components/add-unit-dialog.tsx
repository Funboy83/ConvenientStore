
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
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';

const addUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required.'),
  abbreviation: z.string().min(1, 'Abbreviation is required.'),
});

type AddUnitFormValues = z.infer<typeof addUnitSchema>;

interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUnitDialog({ open, onOpenChange }: AddUnitDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<AddUnitFormValues>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
    },
  });

  async function onSubmit(values: AddUnitFormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    try {
      const unitsCollection = collection(firestore, 'units');
      
      // Check if unit with same name already exists (case-insensitive)
      const nameQuery = query(
        unitsCollection,
        where('name', '==', values.name)
      );
      const existingUnits = await getDocs(nameQuery);
      
      if (!existingUnits.empty) {
        toast({
          variant: 'destructive',
          title: 'Duplicate Unit',
          description: `A unit named "${values.name}" already exists.`,
        });
        return;
      }
      
      await addDoc(unitsCollection, values);
      
      toast({
        title: 'Unit Added',
        description: `Unit "${values.name}" has been successfully created.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding unit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add unit. Please try again.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogDescription>
            Enter the details for the new unit of measure.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Box" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., box" {...field} />
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
              <Button type="submit">Add Unit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
