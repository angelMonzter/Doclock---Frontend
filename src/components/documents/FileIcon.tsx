import { FileText, FileSpreadsheet, Image } from 'lucide-react';
export function FileIcon({ extension }: { extension: string }) {
  const Icon =
    extension === 'xlsx'
      ? FileSpreadsheet
      : ['png', 'jpg', 'jpeg'].includes(extension)
        ? Image
        : FileText;
  const tone =
    extension === 'pdf'
      ? 'pdf'
      : extension === 'xlsx'
        ? 'sheet'
        : extension === 'docx'
          ? 'text'
          : 'image';
  return (
    <span className={`document-icon document-icon-${tone}`} aria-hidden="true">
      <Icon size={23} strokeWidth={1.6} />
    </span>
  );
}
