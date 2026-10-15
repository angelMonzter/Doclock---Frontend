import './category-label.css';

export type CategoryLabelProps = {
  name?: string | null;
  color?: string | null;
};

export function CategoryLabel({ name, color }: CategoryLabelProps) {
  const validColor = color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined;

  return (
    <span className="category-label" style={{ borderColor: validColor }}>
      {validColor && (
        <span
          className="category-label__color"
          style={{ backgroundColor: validColor }}
          aria-hidden="true"
        />
      )}
      <span className="category-label__name">
        {name?.trim() || 'Categoría no disponible'}
      </span>
    </span>
  );
}
