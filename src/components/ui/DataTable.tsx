import type { Key, ReactNode } from 'react';

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  caption: string;
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowId: (row: T) => Key;
  emptyState?: ReactNode;
};

export function DataTable<T>({
  caption,
  rows,
  columns,
  getRowId,
  emptyState = null,
}: DataTableProps<T>) {
  if (!rows.length) return emptyState;

  return (
    <div
      className="data-table-scroll"
      tabIndex={0}
      role="region"
      aria-label={`Tabla de ${caption}`}
    >
      <table className="data-table">
        <caption className="data-table-caption">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column.id}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((column) => (
                <td key={column.id}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
