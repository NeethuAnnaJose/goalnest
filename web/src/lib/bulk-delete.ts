export async function deleteSelectedItems(
  ids: string[],
  deleteFn: (id: string) => Promise<unknown>,
): Promise<{ succeeded: number; failed: number }> {
  const results = await Promise.allSettled(ids.map((id) => deleteFn(id)));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  return { succeeded, failed: ids.length - succeeded };
}
