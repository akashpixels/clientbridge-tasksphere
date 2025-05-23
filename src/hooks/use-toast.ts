
import * as React from "react"
import {
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast"

type ToastScheduleProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

// Update the ToasterToast type to match the expected types for title and description
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode // Changed from string to ReactNode
  description?: React.ReactNode // Changed from string to ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        const timeout = toastTimeouts.get(toastId)
        if (timeout) {
          clearTimeout(timeout)
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Define a complete Toast interface for accepting parameters
interface Toast {
  variant?: ToastProps["variant"]
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function toast(props: Toast) {
  const id = genId()

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })
  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  // Cast the combined properties to ToasterToast to ensure type compatibility
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    } as ToasterToast,
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

// Fix the schedule method to match the Toast interface
toast.schedule = (props: ToastScheduleProps) => {
  return toast({
    ...props,
    variant: "default"
  });
};

export { useToast, toast }
