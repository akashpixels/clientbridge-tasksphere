
import { useToast, toast } from "@/hooks/use-toast";

// Add additional schedule method to the toast object
const originalToast = toast;
const enhancedToast = Object.assign(originalToast, {
  schedule: (props: any) => {
    return originalToast({
      ...props,
      variant: "default"
    });
  }
});

export { useToast, enhancedToast as toast };
