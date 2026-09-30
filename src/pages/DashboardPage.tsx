import {
  ArrowRight,
  ArrowUpFromLine,
  Files,
  FolderOpen,
  HardDrive,
  Clock3,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { RepositoryState } from '@/components/documents/RepositoryState';
import { DocumentCollection } from '@/components/documents/DocumentCollection';
import { getSummary } from '@/models/documents';
import { formatBytes, formatDate } from '@/lib/format';

export function DashboardPage() {
  const query = useDocuments();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!query.data) {
    return (
      <RepositoryState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const data = query.data;
  const summary = getSummary(data);
  const recent = [...data.documents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.name ?? 'de nuevo'}`}
        description="Tu trabajo, organizado. Esto es lo que hay en tu espacio."
        action={
          <Button asChild>
            <Link to="/subir">
              <Plus size={18} /> Subir archivos
            </Link>
          </Button>
        }
      />

      <section className="stats-row" aria-label="Resumen del repositorio">
        <div>
          <span>
            <Files size={18} /> Documentos
          </span>
          <strong>{summary.total}</strong>
          <small>En todo el repositorio</small>
        </div>

        <div>
          <span>
            <FolderOpen size={18} /> Categorías en uso
          </span>
          <strong>{summary.categories}</strong>
          <small>{data.folders.length} carpetas disponibles</small>
        </div>

        <div>
          <span>
            <ArrowUpFromLine size={18} /> Incorporados hoy
          </span>
          <strong>{summary.today}</strong>
          <small>Según la fecha local</small>
        </div>

        <div>
          <span>
            <HardDrive size={18} /> Espacio simulado
          </span>
          <strong>{formatBytes(summary.bytes)}</strong>
          <small>Suma de los tamaños registrados</small>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="panel recent-panel">
          <div className="section-heading">
            <div>
              <h2>Continúa donde lo dejaste</h2>
              <p>Los últimos documentos de tu repositorio.</p>
            </div>
            <span className="count-label">{recent.length} archivos</span>
          </div>

          <DocumentCollection
            documents={recent}
            categories={data.categories}
            onSelect={(id) =>
              navigate(`/documentos?documento=${encodeURIComponent(id)}`)
            }
          />

          <Link className="section-link" to="/documentos">
            Ver todos los documentos <ArrowRight size={16} />
          </Link>
        </section>

        <section className="panel activity-panel">
          <div className="section-heading">
            <div>
              <h2>Actividad reciente</h2>
              <p>Movimientos de esta demostración.</p>
            </div>
            <Clock3 size={19} aria-hidden="true" />
          </div>

          <ol className="activity-list">
            {data.activity.slice(0, 5).map((item) => (
              <li key={item.id}>
                <span className="activity-dot" aria-hidden="true" />
                <div>
                  {item.documentId ? (
                    <Link
                      to={`/documentos?documento=${encodeURIComponent(item.documentId)}`}
                    >
                      {item.text}
                    </Link>
                  ) : (
                    <p>{item.text}</p>
                  )}
                  <time dateTime={item.createdAt}>
                    {formatDate(item.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
