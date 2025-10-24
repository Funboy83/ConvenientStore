'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const addLotSchema = z.object({
  lotName: z.string().min(1, 'Lot name is required.'),
  expiryDate: z.date({ required_error: 'Expiry date is required.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

type AddLotFormValues = z.infer<typeof addLotSchema>;

interface AddLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productNumber: string;
  onSave: (data: { lotName: string; expiryDate: string; quantity: number }) => void;
}

export function AddLotDialog({ open, onOpenChange, productNumber, onSave }: AddLotDialogProps) {
  const form = useForm<AddLotFormValues>({
    resolver: zodResolver(addLotSchema),
    defaultValues: {
      lotName: '',
      expiryDate: undefined,
      quantity: 1,
    },
  });

  function onSubmit(values: AddLotFormValues) {
    const lotData = {
      lotName: values.lotName,
      expiryDate: format(values.expiryDate, 'MM/dd/yyyy'),
      quantity: values.quantity,
    };
    onSave(lotData);
    form.reset();
    onOpenChange(false);
  }

  function onError(errors: any) {
    console.error('Form validation errors:', errors);
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened, resetting form');
      form.reset({
        lotName: '',
        expiryDate: undefined,
        quantity: 1,
      });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add new lot for {productNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <FormField
              control={form.control}
              name="lotName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lot name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter lot name"
                      className="border-blue-500 focus:border-blue-600"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal border-blue-500',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      className="border-blue-500 focus:border-blue-600"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
