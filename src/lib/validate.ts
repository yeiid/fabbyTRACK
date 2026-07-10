export function required(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} es requerido`;
  }
  return null;
}

export function isNumber(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} debe ser un número válido`;
  }
  return null;
}

export function isPositiveNumber(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return `${fieldName} debe ser un número positivo`;
  }
  return null;
}

export function isEmail(value: unknown): string | null {
  if (!value || typeof value !== 'string') return 'Email inválido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Formato de email inválido';
  }
  return null;
}

export function minLength(value: unknown, min: number, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.length < min)) {
    return `${fieldName} debe tener al menos ${min} caracteres`;
  }
  return null;
}

export function validateAll(validations: (string | null)[]): string | null {
  for (const v of validations) {
    if (v) return v;
  }
  return null;
}
