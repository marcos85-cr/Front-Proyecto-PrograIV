/**
 * Modelo de proveedor para el sistema bancario
 */
export interface Provider {
  id: number;
  nombre: string;
  reglaValidacionContrato: string;
  formatoContrato: string;
}

/**
 * Filtros para búsqueda de proveedores
 */
export interface ProviderFilters {
  nombre?: string;
  page?: number;
  limit?: number;
}

/**
 * Datos para crear o actualizar un proveedor
 */
export interface ProviderCreateData {
  nombre: string;
  reglaValidacionContrato: string;
  formatoContrato: string;
}

export interface ProviderUpdateData extends ProviderCreateData {
  id: number;
}
