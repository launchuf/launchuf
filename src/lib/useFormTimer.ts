import { useCallback, useEffect, useRef } from "react";

/** Mäter hur länge formuläret varit öppet (används som enkel botkontroll på servern). */
export function useFormTimer() {
  const started = useRef<number>(0);
  useEffect(() => { started.current = Date.now(); }, []);
  return useCallback(() => (started.current ? Date.now() - started.current : 0), []);
}
