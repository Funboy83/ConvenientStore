'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const addSupplierSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required.'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  state: z.string().optional(),
  county: z.string().optional(),
});

type AddSupplierFormValues = z.infer<typeof addSupplierSchema>;

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSupplierDialog({ open, onOpenChange }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const form = useForm<AddSupplierFormValues>({
    resolver: zodResolver(addSupplierSchema),
    defaultValues: {
      supplierName: '',
      phoneNumber: '',
      email: '',
      address: '',
      state: '',
      county: '',
    },
  });

  async function onSubmit(values: AddSupplierFormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    try {
      // Generate supplier number (format: NCCOXXXXX)
      const suppliersCollection = collection(firestore, 'suppliers');
      const timestamp = Date.now();
      const supplierNumber = `NCC${String(timestamp).slice(-6).padStart(6, '0')}`;

      // Clean up the data - remove empty optional fields
      const cleanData: any = {
        supplierNumber,
        supplierName: values.supplierName,
        createdAt: new Date().toISOString(),
        totalPurchaseAmount: 0,
        creditAmount: 0,
      };

      // Only add optional fields if they have values
      if (values.phoneNumber) cleanData.phoneNumber = values.phoneNumber;
      if (values.email) cleanData.email = values.email;
      if (values.address) cleanData.address = values.address;
      if (values.state) cleanData.state = values.state;
      if (values.county) cleanData.county = values.county;

      await addDoc(suppliersCollection, cleanData);
      
      toast({
        title: 'Supplier Added',
        description: `Supplier "${values.supplierName}" (${supplierNumber}) has been successfully created.`,
      });
      form.reset();
      setIsAddressExpanded(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add supplier. Please try again.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create supplier</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier name</FormLabel>
                    <FormControl>
                      <Input placeholder="Required" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Supplier number</FormLabel>
                <FormControl>
                  <Input placeholder="Auto-generated" disabled />
                </FormControl>
              </FormItem>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Section - Collapsible */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">Address</span>
                {isAddressExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {isAddressExpanded && (
                <div className="p-4 pt-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter address" 
                            className="resize-none"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Search State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <FormControl>
                            <Input placeholder="Search County" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
