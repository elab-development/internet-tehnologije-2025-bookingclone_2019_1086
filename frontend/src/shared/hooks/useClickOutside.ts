import { useEffect, useRef } from "react";

export function useClickOutside<T extends HTMLElement>(
  onClickOutside: () => void
) {
  const elementRef = useRef<T | null>(null);
  const handlerRef = useRef(onClickOutside);

  useEffect(() => {
    handlerRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (!elementRef.current) {
        return;
      }

      if (elementRef.current.contains(event.target as Node)) {
        return;
      }

      handlerRef.current();
    }

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return elementRef;
}
