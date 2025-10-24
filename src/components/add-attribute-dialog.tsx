
'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, setDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const addAttributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required.'),
  values: z.array(z.object({ value: z.string().min(1, 'Value cannot be empty.') })),
});

const addValueSchema = z.object({
    attributeName: z.string().min(1, "Please select an attribute."),
    newValue: z.string().min(1, "New value cannot be empty."),
})

type AddAttributeFormValues = z.infer<typeof addAttributeSchema>;
type AddValueFormValues = z.infer<typeof addValueSchema>;

interface AddAttributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeType?: string | null; // e.g., 'category', 'brand'
}

export function AddAttributeDialog({ open, onOpenChange, attributeType }: AddAttributeDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const attributesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'productAttributes');
  }, [firestore]);
  const { data: attributes } = useCollection(attributesQuery);

  const defaultTab = attributeType ? "addValue" : "createAttribute";

  // Form for creating a new attribute type
  const createForm = useForm<AddAttributeFormValues>({
    resolver: zodResolver(addAttributeSchema),
    defaultValues: { name: '', values: [{ value: '' }] },
  });

  // Form for adding a value to an existing attribute type
  const addValueForm = useForm<AddValueFormValues>({
    resolver: zodResolver(addValueSchema),
    defaultValues: { attributeName: attributeType || '', newValue: '' },
  });

  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: 'values',
  });

  async function onCreateSubmit(values: AddAttributeFormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    try {
      const docId = values.name.toLowerCase();
      const attributeRef = doc(firestore, 'productAttributes', docId);
      
      await setDoc(attributeRef, { 
        name: values.name, 
        values: values.values.map(v => v.value) 
      });
      
      toast({
        title: 'Attribute Created',
        description: `Attribute "${values.name}" has been created.`,
      });
      createForm.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating attribute:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create attribute.',
      });
    }
  }

  async function onAddValueSubmit(values: AddValueFormValues) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase not initialized.',
      });
      return;
    }

    try {
      const docId = values.attributeName.toLowerCase();
      const attributeRef = doc(firestore, 'productAttributes', docId);
      
      await updateDoc(attributeRef, {
        values: arrayUnion(values.newValue)
      });
      
      toast({
        title: 'Value Added',
        description: `Added "${values.newValue}" to ${values.attributeName}.`,
      });
      addValueForm.reset({attributeName: attributeType || '', newValue: '' });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding value:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add value.',
      });
    }
  }
  
  // Reset form when dialog opens with a specific type
  useState(() => {
    if(attributeType) {
        addValueForm.reset({ attributeName: attributeType, newValue: '' });
    }
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Attributes</DialogTitle>
          <DialogDescription>
            Create a new attribute type or add a value to an existing one.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="createAttribute" disabled={!!attributeType}>Create New</TabsTrigger>
                <TabsTrigger value="addValue">Add Value</TabsTrigger>
            </TabsList>
            <TabsContent value="createAttribute">
                <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-4">
                    <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Attribute Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Color" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div>
                        <FormLabel>Values</FormLabel>
                        <div className="space-y-2 pt-2">
                            {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <FormField
                                control={createForm.control}
                                name={`values.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="e.g., Red" {...field} />
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
                                disabled={fields.length === 1}
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
                            onClick={() => append({ value: '' })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Value
                        </Button>
                    </div>
                    <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Create Attribute</Button>
                    </DialogFooter>
                </form>
                </Form>
            </TabsContent>
            <TabsContent value="addValue">
                 <Form {...addValueForm}>
                    <form onSubmit={addValueForm.handleSubmit(onAddValueSubmit)} className="space-y-4 pt-4">
                         <FormField
                            control={addValueForm.control}
                            name="attributeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attribute Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an attribute" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {attributes?.map(attr => (
                                                <SelectItem key={attr.id} value={attr.name}>{attr.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={addValueForm.control}
                            name="newValue"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>New Value</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Blue" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Add Value</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
