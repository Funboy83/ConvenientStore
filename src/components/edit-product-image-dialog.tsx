'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePlus, Link as LinkIcon } from 'lucide-react';

interface EditProductImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentImageUrl?: string;
  onSave: (imageUrl: string) => void;
}

export function EditProductImageDialog({ 
  open, 
  onOpenChange, 
  productName, 
  currentImageUrl,
  onSave 
}: EditProductImageDialogProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (open) {
      setImageUrl(currentImageUrl || '');
      setPreviewError(false);
    }
  }, [open, currentImageUrl]);

  const convertGsToHttps = (url: string): string => {
    // Convert gs:// URL to HTTPS URL
    if (url.startsWith('gs://')) {
      // Extract bucket and path from gs://bucket/path
      const gsPattern = /^gs:\/\/([^\/]+)\/(.+)$/;
      const match = url.match(gsPattern);
      
      if (match) {
        const bucket = match[1];
        const filePath = match[2];
        // Encode the file path
        const encodedPath = encodeURIComponent(filePath);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
      }
    }
    return url;
  };

  const handleSave = () => {
    const finalUrl = convertGsToHttps(imageUrl.trim());
    onSave(finalUrl);
    onOpenChange(false);
  };

  const handleRemoveImage = () => {
    onSave('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Edit Product Image - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Image Preview */}
          {(imageUrl || currentImageUrl) && !previewError ? (
            <div className="flex flex-col items-center gap-2">
              <Label>Current Image</Label>
              <img 
                src={convertGsToHttps(imageUrl || currentImageUrl || '')} 
                alt="Preview"
                className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                onError={() => setPreviewError(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImagePlus className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">No image</p>
                </div>
              </div>
            </div>
          )}

          {/* Image URL Input */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Firebase Storage Image URL
            </Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="gs://... or https://firebasestorage.googleapis.com/..."
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewError(false);
              }}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Paste the Firebase Storage URL (gs:// or https://) for your product image
            </p>
            {imageUrl.startsWith('gs://') && (
              <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-200">
                ✓ Will convert to: {convertGsToHttps(imageUrl).substring(0, 60)}...
              </div>
            )}
          </div>

          {previewError && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              ⚠️ Unable to load image. Please check the URL.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentImageUrl && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveImage}
            >
              Remove Image
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
