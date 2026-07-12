import { useEffect, type RefObject } from "react";

/**
 * Closes an open menu/dropdown/popover when the user clicks or taps outside
 * the referenced element. Used to fix ellipsis/options menus across the app
 * that previously stayed open after an outside click.
 *
 * @param ref Ref attached to the menu/panel container.
 * @param isOpen Whether the menu is currently open (listener is skipped when closed).
 * @param onClose Called when a pointer event occurs outside the referenced element.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, ref, onClose]);
}
