/**
 * Formatting utility functions for the application
 */

/**
 * Format a currency value according to Indian Rupee format
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/**
 * Convert millimeters to inches
 * @param mm - Value in millimeters
 * @returns Value in inches
 */
export function mmToInch(mm: number): number {
  return mm / 25.4; // 1 inch = 25.4 mm
}

/**
 * Format a measurement based on the unit preference
 * @param value - The measurement value
 * @param unit - The unit to format to (mm or inch)
 * @returns Formatted measurement string
 */
export function formatMeasurement(value: number, unit: 'mm' | 'inch'): string {
  if (unit === 'inch') {
    const inches = mmToInch(value);
    return `${inches.toFixed(2)}`;
  }
  return `${value}mm`;
}

/**
 * Format sheet size description based on the unit preference
 * @param width - Width in mm
 * @param height - Height in mm
 * @param unit - The unit to format to (mm or inch)
 * @returns Formatted sheet size description
 */
export function formatSheetSizeDescription(width: number, height: number, unit: 'mm' | 'inch'): string {
  if (unit === 'inch') {
    return `${mmToInch(width).toFixed(2)}" × ${mmToInch(height).toFixed(2)}"`;
  }
  return `${width}mm × ${height}mm`;
}
