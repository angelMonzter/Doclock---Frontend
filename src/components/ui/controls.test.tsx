import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { CheckboxField } from './CheckboxField';
import { DataTable } from './DataTable';

describe('contratos de los controles compartidos', () => {
  it('asocia etiqueta y error del selector sin perder descripciones externas', () => {
    const html = renderToStaticMarkup(
      <SelectField
        id="category"
        label="Categoría"
        error="Selecciona una categoría"
        hint="Ayuda que no debe mostrarse"
        aria-describedby="external-help"
        disabled
        required
        defaultValue=""
      >
        <option value="">Selecciona</option>
      </SelectField>,
    );

    expect(html).toContain('for="category"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="external-help category-message"');
    expect(html).toContain('id="category-message"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('required=""');
    expect(html).not.toContain('Ayuda que no debe mostrarse');
  });

  it('mantiene límites nativos y ayuda asociada en el área de texto', () => {
    const html = renderToStaticMarkup(
      <TextareaField
        id="description"
        label="Descripción"
        rows={3}
        maxLength={500}
        defaultValue="Documento"
        hint="9/500 caracteres"
        readOnly
      />,
    );

    expect(html).toContain('for="description"');
    expect(html).toContain('rows="3"');
    expect(html).toContain('maxLength="500"');
    expect(html).toContain('readOnly=""');
    expect(html).toContain('aria-describedby="description-message"');
    expect(html).toContain('Documento</textarea>');
  });

  it('genera identificadores distintos y conserva el estado del checkbox', () => {
    const html = renderToStaticMarkup(
      <>
        <CheckboxField label="Activo" defaultChecked disabled />
        <CheckboxField label="Descargas" />
      </>,
    );
    const ids = [...html.matchAll(/<input[^>]* id="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`for="${id}"`);
    expect(html).toContain('checked=""');
    expect(html).toContain('disabled=""');
  });

  it('renderiza columnas y acciones tipadas dentro de una tabla accesible', () => {
    const html = renderToStaticMarkup(
      <DataTable
        caption="Usuarios"
        rows={[{ id: '1', name: 'Mariana' }]}
        getRowId={(row) => row.id}
        columns={[
          { id: 'name', header: 'Nombre', cell: (row) => row.name },
          {
            id: 'actions',
            header: 'Acciones',
            cell: (row) => <button>Editar {row.name}</button>,
          },
        ]}
      />,
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('<caption class="data-table-caption">Usuarios</caption>');
    expect(html).toContain('<th scope="col">Nombre</th>');
    expect(html).toContain('<button>Editar Mariana</button>');
  });

  it('permite a la página componer el estado vacío', () => {
    const html = renderToStaticMarkup(
      <DataTable
        caption="Usuarios"
        rows={[]}
        columns={[]}
        getRowId={() => ''}
        emptyState={<p>Sin coincidencias</p>}
      />,
    );

    expect(html).toBe('<p>Sin coincidencias</p>');
  });
});
