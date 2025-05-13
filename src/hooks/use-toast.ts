import * as React from "react"
import { Cross2Icon } from "@radix-ui/react-icons"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[390px]",
        className
      )}
      {...props}
    />
  )
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        "group relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 shadow-lg transition-all data-[swipe]:animate-hide data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe]:duration-100 data-[state=closed]:duration-300 data-[state=open]:duration-700 data-[state=closed]:ease-in data-[state=open]:ease-out",
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastTrigger = ToastPrimitives.Trigger
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md text-gray-400 opacity-0 transition-opacity hover:text-gray-500 focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 group-hover:opacity-100",
        className
      )}
      aria-label="Close"
      {...props}
    >
      <Cross2Icon className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
})
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn("mb-1 text-sm font-semibold [&[data-state=open]]:animate-in [&[data-state=closed]]:animate-out [&[data-state=closed]]:fade-out-80 [&[data-state=open]]:fade-in-80 [&[data-state=closed]]:zoom-out-95 [&[data-state=open]]:zoom-in-95", className)}
      {...props}
    />
  )
})
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm opacity-70 [&[data-state=open]]:animate-in [&[data-state=closed]]:animate-out [&[data-state=closed]]:fade-out-80 [&[data-state=open]]:fade-in-80 [&[data-state=closed]]:zoom-out-95 [&[data-state=open]]:zoom-in-95", className)}
      {...props}
    />
  )
})
ToastDescription.displayName = ToastPrimitives.Description.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-gray-700 bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 [&:disabled]:pointer-events-none [&:disabled]:opacity-50 [&[data-state=open]]:animate-in [&[data-state=closed]]:animate-out [&[data-state=closed]]:fade-out-80 [&[data-state=open]]:fade-in-80 [&[data-state=closed]]:zoom-out-95 [&[data-state=open]]:zoom-in-95", className)}
      {...props}
    />
  )
})
ToastAction.displayName = ToastPrimitives.Action.displayName

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
)

interface ToastProps extends React.ComponentPropsWithoutRef<typeof Toast> {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: VariantProps<typeof toastVariants>["variant"]
}

const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = (toast: ToastProps) => {
    setToasts((prevToasts) => [...prevToasts, toast])
  }

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  const updateToast = (id: string, toast: ToastProps) => {
    setToasts((prevToasts) =>
      prevToasts.map((t) => (t.id === id ? { ...t, ...toast } : t))
    )
  }

  return {
    toasts,
    addToast,
    dismissToast,
    updateToast,
  }
}

let count = 0

const showToast = ({ ...props }: ToastProps) => {
  const id = String(count++)
  useToast.getState().addToast({ id, ...props, open: true })
  return id
}

export {
  useToast,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTrigger,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
  showToast,
}

export const toast = {
  success: (props: ToastProps) => {
    const { title, description, ...rest } = props;
    return showToast({
      title: title || "Success",
      description: description || "Your action was successful.",
      variant: "success",
      ...rest,
    });
  },
  error: (props: ToastProps) => {
    const { title, description, ...rest } = props;
    return showToast({
      title: title || "Error",
      description: description || "Something went wrong. Please try again.",
      variant: "destructive",
      ...rest,
    });
  },
  info: (props: ToastProps) => {
    const { title, description, ...rest } = props;
    return showToast({
      title: title || "Info",
      description: description || "Here is some information for you.",
      ...rest,
    });
  },
  warning: (props: ToastProps) => {
    const { title, description, ...rest } = props;
    return showToast({
      title: title || "Warning",
      description: description || "Please be careful.",
      ...rest,
    });
  },
  schedule: (props: ToastProps) => {
    const { title, description, ...rest } = props;
    return showToast({
      title: title || "Schedule Calculated",
      description: description || "Task start time and ETA have been calculated.",
      variant: "success",
      ...rest,
    });
  },
};
