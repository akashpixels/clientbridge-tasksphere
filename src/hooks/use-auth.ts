
import { useState, useEffect } from "react";

// Simple auth hook for the application
export function useAuth() {
  const [authState, setAuthState] = useState<boolean>(true); // Temporarily setting to true for testing
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Simulate auth loading for testing purposes
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { authState, loading };
}
