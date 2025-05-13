
import * as React from "react";
import { create } from "zustand";
import { cva, type VariantProps } from "class-variance-authority";
import { ToastActionElement, ToastProps } from "@/components/ui/toast";

const toastVariants = cva(
  "group relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 shadow-lg transition-all data-[swipe]:animate-hide data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe]:duration-100 data-[state=closed]:duration-300 data-[state=open]:duration-700 data-[state=closed]:ease-in data-[state=open]:ease-out",
  {
    variants: {
      variant: {
        default: "border",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-success bg-success text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type ToastVariant = VariantProps<typeof toastVariants>["variant"];

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
  open: boolean;
}

interface ToasterStore {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  dismissToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
}

const useToastStore = create<ToasterStore>((set) => ({
  toasts: [],
  addToast: (toast: Toast) => {
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
  },
  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  updateToast: (id: string, toast: Partial<Toast>) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...toast } : t)),
    }));
  },
}));

let count = 0;

function showToast({ ...props }: Omit<Toast, "id" | "open">) {
  const id = String(count++);
  useToastStore.getState().addToast({ id, ...props, open: true });
  return id;
}

interface ToastParams {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
}

// The main toast function that can be called directly
function toastFunction(props: ToastParams) {
  return showToast(props);
}

// Add methods to the toast function
toastFunction.success = (props: Omit<ToastParams, "variant">) => {
  const { title, description, ...rest } = props;
  return showToast({
    title: title || "Success",
    description: description || "Your action was successful.",
    variant: "success",
    ...rest,
  });
};

toastFunction.error = (props: Omit<ToastParams, "variant">) => {
  const { title, description, ...rest } = props;
  return showToast({
    title: title || "Error",
    description: description || "Something went wrong. Please try again.",
    variant: "destructive",
    ...rest,
  });
};

toastFunction.info = (props: Omit<ToastParams, "variant">) => {
  const { title, description, ...rest } = props;
  return showToast({
    title: title || "Info",
    description: description || "Here is some information for you.",
    ...rest,
  });
};

toastFunction.warning = (props: Omit<ToastParams, "variant">) => {
  const { title, description, ...rest } = props;
  return showToast({
    title: title || "Warning",
    description: description || "Please be careful.",
    ...rest,
  });
};

toastFunction.schedule = (props: Omit<ToastParams, "variant">) => {
  const { title, description, ...rest } = props;
  return showToast({
    title: title || "Schedule Calculated",
    description: description || "Task start time and ETA have been calculated.",
    variant: "success",
    ...rest,
  });
};

// Export the toast function with methods
export const toast = toastFunction;

export function useToast() {
  return {
    toast: toastFunction,
    ...useToastStore.getState(),
  };
}
