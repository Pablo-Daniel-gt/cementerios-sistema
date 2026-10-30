/**
 * Utilidades para validación y sanitización de entradas numéricas en el Frontend.
 * Evita la escritura y pegado de letras o caracteres inválidos en campos numéricos
 * sin requerir modificaciones en la base de datos de Supabase.
 */

/**
 * Filtra un valor dejando exclusivamente caracteres numéricos (dígitos 0-9).
 * @param {string|number} value
 * @returns {string}
 */
export const filterDigits = (value) => {
  return String(value ?? '').replace(/\D/g, '');
};

/**
 * Filtra un valor numérico decimal (precios, montos) permitiendo dígitos y un único punto decimal.
 * @param {string|number} value
 * @returns {string}
 */
export const filterDecimal = (value) => {
  let str = String(value ?? '').replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
};

/**
 * Manejador onKeyDown para campos estrictamente numéricos (DPI, Teléfono, No. Boleta).
 * Bloquea la pulsación de cualquier letra o caracter especial, permitiendo teclas de control y atajos.
 * @param {KeyboardEvent} e
 */
export const handleNumericKeyDown = (e) => {
  // Permitir combinaciones de control (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+Z, etc.)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (allowedKeys.includes(e.key)) return;

  // Bloquear cualquier tecla que no sea dígito
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Manejador onKeyDown para montos y precios con soporte de decimales.
 * Bloquea letras, notación científica ('e', 'E'), signos ('+', '-') y puntos decimales duplicados.
 * @param {KeyboardEvent} e
 */
export const handleDecimalKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (allowedKeys.includes(e.key)) return;

  // Evitar notación científica y signos
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
    return;
  }

  // Permitir punto decimal sólo una vez
  if (e.key === '.' || e.key === ',') {
    if (String(e.target.value).includes('.')) {
      e.preventDefault();
    }
    return;
  }

  // Bloquear cualquier otra tecla que no sea dígito
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Manejador onKeyDown para enteros positivos (filas, columnas, capacidad).
 * Bloquea letras, puntos, comas, notación científica y signos negativos.
 * @param {KeyboardEvent} e
 */
export const handleIntegerKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (allowedKeys.includes(e.key)) return;

  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault();
    return;
  }

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};
