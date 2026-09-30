import { FileText, FolderClosed, ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/brand/Brand';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-story" aria-label="Tu espacio documental">
        <Brand inverse />
        <div className="story-body">
          <h1>
            Todo en orden.
            <br />
            <span>Todo a tu alcance.</span>
          </h1>
          <p>
            Un espacio para tus documentos.
            <br />
            Un lugar para continuar tu trabajo.
          </p>
          <div
            className="document-preview"
            aria-label="Vista ilustrativa de una carpeta de documentos"
          >
            <div className="preview-top">
              <span>
                <FolderClosed size={19} /> Mi espacio de trabajo
              </span>
              <span className="preview-label">Ejemplo</span>
            </div>
            <div className="preview-path">
              Documentos <span>/</span> General
            </div>
            <div className="preview-file">
              <span className="file-symbol">
                <FileText size={23} strokeWidth={1.5} />
              </span>
              <div>
                <strong>Todo comienza aquí</strong>
                <span>Tu próximo documento, en su lugar.</span>
              </div>
              <ArrowUpRight size={19} className="preview-arrow" />
            </div>
            <div className="preview-bottom">
              <span className="folder-line" />
              <span>Espacio para nuevas ideas.</span>
            </div>
          </div>
        </div>
        <div className="story-footer">
          <span>Menos búsquedas. Más claridad.</span>
          <span>Archivo / 2026</span>
        </div>
      </section>
      <section className="login-main" aria-labelledby="login-title">
        <div className="mobile-brand">
          <Brand />
        </div>
        <span className="environment-label">
          <span /> Entorno de demostración
        </span>
        <div className="login-content">
          <header className="login-heading">
            <h2 id="login-title">Bienvenido de nuevo</h2>
            <p>Ingresa a tu espacio de trabajo.</p>
          </header>
          <LoginForm />
          <p className="access-note">
            ¿Necesitas una cuenta?{' '}
            <span>Solicítala al administrador de tu organización.</span>
          </p>
        </div>
        <footer className="login-footer">
          Prototipo de interfaz · Sin conexión a la base de datos
        </footer>
      </section>
    </main>
  );
}
