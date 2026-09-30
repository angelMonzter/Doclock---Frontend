import type { DocumentSnapshot } from '@/types/documents';

export function createSeed(): DocumentSnapshot {
  const now = Date.now();
  const folders = [
    { id: 'finance', name: 'Finanzas', parentId: null },
    { id: 'people', name: 'Personas y cultura', parentId: null },
    { id: 'legal', name: 'Legal', parentId: null },
    { id: 'operations', name: 'Operaciones', parentId: null },
    { id: 'brand', name: 'Marca y comunicación', parentId: null },
    { id: 'projects', name: 'Proyectos', parentId: null },
    { id: 'reports', name: 'Informes', parentId: 'finance' },
  ];
  const categories = [
    { id: 'report', name: 'Informe' },
    { id: 'contract', name: 'Contrato' },
    { id: 'guide', name: 'Guía' },
    { id: 'visual', name: 'Material visual' },
  ];
  const documents = [
    {
      title: 'Presupuesto de operaciones',
      originalName: 'Presupuesto_operaciones.xlsx',
      extension: 'xlsx',
      bytes: 1854000,
      folderId: 'finance',
      categoryId: 'report',
      author: 'Mariana Vega',
    },
    {
      title: 'Guía de bienvenida',
      originalName: 'Guia_bienvenida.docx',
      extension: 'docx',
      bytes: 2430000,
      folderId: 'people',
      categoryId: 'guide',
      author: 'Roberto Silva',
    },
    {
      title: 'Contrato de prestación de servicios',
      originalName: 'Contrato_servicios.pdf',
      extension: 'pdf',
      bytes: 3280000,
      folderId: 'legal',
      categoryId: 'contract',
      author: 'Mariana Vega',
    },
    {
      title: 'Informe financiero del trimestre',
      originalName: 'Informe_financiero.pdf',
      extension: 'pdf',
      bytes: 4700000,
      folderId: 'reports',
      categoryId: 'report',
      author: 'Carlos Mendoza',
    },
    {
      title: 'Identidad visual',
      originalName: 'Identidad_visual.png',
      extension: 'png',
      bytes: 2180000,
      folderId: 'brand',
      categoryId: 'visual',
      author: 'Elena Torres',
    },
    {
      title: 'Manual de procedimientos',
      originalName: 'Manual_procedimientos.docx',
      extension: 'docx',
      bytes: 920000,
      folderId: 'operations',
      categoryId: 'guide',
      author: 'Roberto Silva',
    },
    {
      title: 'Resultados comerciales',
      originalName: 'Resultados_comerciales.xlsx',
      extension: 'xlsx',
      bytes: 1370000,
      folderId: 'finance',
      categoryId: 'report',
      author: 'Carlos Mendoza',
    },
    {
      title: 'Fotografía del espacio de trabajo',
      originalName: 'Espacio_trabajo.jpg',
      extension: 'jpg',
      bytes: 2640000,
      folderId: 'brand',
      categoryId: 'visual',
      author: 'Elena Torres',
    },
  ].map((file, index) => ({
    ...file,
    id: `sample-${index + 1}`,
    description:
      'Documento de ejemplo para explorar la organización del repositorio. No contiene un archivo descargable.',
    createdAt: new Date(now - index * 7 * 3600000).toISOString(),
  }));
  return {
    folders,
    categories,
    documents,
    activity: documents
      .slice(0, 5)
      .map((doc) => ({
        id: `activity-${doc.id}`,
        text: `${doc.author} incorporó «${doc.title}».`,
        createdAt: doc.createdAt,
        documentId: doc.id,
      })),
  };
}
