import { useRef, useState } from "react";

export function useAsyncAction() {
  const lockedRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const run = async (action: () => void | Promise<void>) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setIsPending(true);
    try {
      await action();
    } finally {
      lockedRef.current = false;
      setIsPending(false);
    }
  };

  return { isPending, run };
}
