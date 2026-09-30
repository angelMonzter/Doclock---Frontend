// Valores provisionales de la demo; el backend deberá validar su propia política.
export const filePolicy = {
  extensions: ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'],
  maxBytes: 10 * 1024 * 1024,
  maxFiles: 10,
  capacityBytes: 1024 * 1024 * 1024,
} as const;
