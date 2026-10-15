import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryLabel } from './CategoryLabel';

it('conserva el nombre y oculta al lector de pantalla la muestra decorativa', () => {
  const html = renderToStaticMarkup(
    <CategoryLabel name="Legal" color="#ffffff" />,
  );
  expect(html).toContain('Legal');
  expect(html).toContain('background-color:#ffffff');
  expect(html).toContain('aria-hidden="true"');
});

it.each([undefined, null, '', 'red', 'url(example)'])(
  'no inventa un color cuando recibe %s',
  (color) => {
    const html = renderToStaticMarkup(
      <CategoryLabel name="Legal" color={color} />,
    );
    expect(html).toContain('Legal');
    expect(html).not.toContain('category-label__color');
  },
);

it('indica que la categoría no está disponible cuando falta su nombre', () => {
  expect(renderToStaticMarkup(<CategoryLabel />)).toContain(
    'Categoría no disponible',
  );
});
