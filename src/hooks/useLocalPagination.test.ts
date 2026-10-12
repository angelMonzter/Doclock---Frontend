// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useLocalPagination } from './useLocalPagination';

it('reinicia al filtrar y ajusta la última página al quitar registros', () => {
  const rows = Array.from({ length: 26 }, (_, index) => index);
  const { result, rerender } = renderHook(
    ({ items, filter }) => useLocalPagination(items, filter),
    { initialProps: { items: rows, filter: '' } },
  );
  act(() => result.current.pagination.onPageChange(2));
  expect(result.current.items).toEqual([25]);
  rerender({ items: rows.slice(0, 25), filter: '' });
  expect(result.current.pagination.page).toBe(1);
  rerender({ items: [25], filter: 'último' });
  expect(result.current.items).toEqual([25]);
  expect(result.current.pagination.page).toBe(1);
  act(() => result.current.pagination.onPageSizeChange(10));
  expect(result.current.pagination.pageSize).toBe(10);
});
