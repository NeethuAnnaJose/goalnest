/**
 * @deprecated Use `useConfirmDelete()` from `@/hooks/use-confirm-delete` instead.
 */
export function confirmDelete(): never {
  throw new Error('Use useConfirmDelete() instead of window.confirm');
}
