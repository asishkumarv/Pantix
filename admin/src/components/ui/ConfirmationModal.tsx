import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDestructive = true,
}: ConfirmationModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-b from-[#0b221cb8] to-[#081c16d1] border-border/50 text-foreground shadow-2xl backdrop-blur-md max-w-md rounded-2xl">
        <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white font-display">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-3 mt-4 w-full">
          <AlertDialogCancel className="flex-1 mt-0 bg-secondary hover:bg-secondary/80 border-border/50 text-white font-semibold h-11 rounded-xl">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`flex-1 font-semibold h-11 rounded-xl text-white ${
              isDestructive
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary-gradient shadow-glow hover:opacity-90 transition-smooth"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
