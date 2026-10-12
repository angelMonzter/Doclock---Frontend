import { Button } from './button';
import { SelectField } from './SelectField';

export type PaginationProps = {
  label: string;
  page: number;
  pageSize: number;
  total: number;
  busy?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function Pagination({
  label,
  page,
  pageSize,
  total,
  busy = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      className="form-actions list-pagination"
      aria-label={label}
      aria-busy={busy}
    >
      <SelectField
        label="Registros por página"
        value={pageSize}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
      >
        {[10, 25, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </SelectField>
      <Button
        variant="secondary"
        disabled={busy || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>
      <span role="status">
        Página {page} de {pages} · {total} registros
      </span>
      <Button
        variant="secondary"
        disabled={busy || page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </Button>
    </nav>
  );
}
