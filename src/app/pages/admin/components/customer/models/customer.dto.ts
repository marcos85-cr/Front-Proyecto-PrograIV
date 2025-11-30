export interface Customer {
  id: string;
  nombre: string;
  email: string;
  identificacion: string;
  telefono: string;
  cuentasActivas: number;
  ultimaOperacion: Date;
  estado: 'Activo' | 'Inactivo';
  volumenTotal: number;
}
