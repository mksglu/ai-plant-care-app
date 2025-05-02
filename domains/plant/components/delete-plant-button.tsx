'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { deletePlant } from '../actions/plant';
import { Button } from '@/components/ui/button';
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

interface DeletePlantButtonProps {
  plantId: number;
  plantName: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  redirectPath?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeletePlantButton({
  plantId,
  plantName,
  variant = 'destructive',
  size = 'sm',
  className,
  redirectPath,
  onSuccess,
  open,
  onOpenChange,
}: DeletePlantButtonProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;

  const handleOpenChange = (newOpenState: boolean) => {
    if (isControlled) {
      onOpenChange(newOpenState);
    } else {
      setInternalIsOpen(newOpenState);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deletePlant(plantId);
      if (success) {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          if (onSuccess) {
            onSuccess();
          }
          
          router.refresh();
        }
      } else {
        console.error('Failed to delete plant');
      }
    } catch (error) {
      console.error('Error deleting plant:', error);
    } finally {
      setIsDeleting(false);
      handleOpenChange(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => handleOpenChange(true)}
        >
          {size === 'icon' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </>
          )}
        </Button>
      )}

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="rounded-xl border p-6 max-w-lg h-fit mx-auto my-auto shadow-md">
          <AlertDialogHeader className="mb-4">
            <AlertDialogTitle className="text-lg font-semibold">Delete Plant</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete &quot;{plantName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 gap-3 flex sm:justify-end">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="h-9 rounded-md px-4"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 rounded-md px-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 