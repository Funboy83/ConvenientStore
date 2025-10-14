
'use client';

import Image from 'next/image';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { add, format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { inventory as allInventory } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AddStockDialog } from '@/components/add-stock-dialog';
import { useState } from 'react';

export default function InventoryPage() {
  // Sort batches by received date to find the oldest one (FIFO)
  const inventoryWithSortedBatches = allInventory.map((item) => ({
    ...item,
    batches: [...item.batches].sort(
      (a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime()
    ),
  }));

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Inventory Management"
        description="Track and manage your product stock using FIFO."
      >
        <Button onClick={() => setIsAddStockOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Stock
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            A list of all products in your inventory. Oldest batches are
            highlighted for FIFO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryWithSortedBatches.map((item) =>
                item.batches.map((batch, index) => {
                  const isOldest = index === 0;
                  const expiryDate =
                    batch.expiryDate !== 'N/A'
                      ? new Date(batch.expiryDate)
                      : null;
                  const isExpiringSoon = expiryDate
                    ? expiryDate < add(new Date(), { days: 7 })
                    : false;

                  return (
                    <TableRow
                      key={`${item.id}-${batch.id}`}
                      className={cn(
                        isOldest && 'bg-primary/5 hover:bg-primary/10'
                      )}
                    >
                      {index === 0 && (
                        <TableCell
                          className="hidden sm:table-cell"
                          rowSpan={item.batches.length}
                        >
                          <Image
                            alt={item.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={item.image}
                            width="64"
                            data-ai-hint={item.imageHint}
                          />
                        </TableCell>
                      )}
                      {index === 0 && (
                        <TableCell
                          className="font-medium"
                          rowSpan={item.batches.length}
                        >
                          <div className="font-bold">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.sku}
                          </div>
                          <Badge variant="outline" className="mt-2">
                            {item.category}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{batch.id}</span>
                          {isOldest && (
                            <Badge className="bg-primary/80 hover:bg-primary/90 text-primary-foreground">
                              FIFO
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{batch.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(batch.receivedDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {expiryDate ? (
                          <span
                            className={cn(
                              isExpiringSoon && 'text-destructive font-semibold'
                            )}
                          >
                            {format(expiryDate, 'MMM dd, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                            <DropdownMenuItem>Print Label</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddStockDialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen} />
    </>
  );
}
