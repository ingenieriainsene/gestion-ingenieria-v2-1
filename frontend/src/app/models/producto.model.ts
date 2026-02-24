export interface Producto {
  id?: number;
  codRef: string;
  descripcion: string;
  coste: number;
  margen?: number;
  iva?: number;
  precioVenta?: number;
  categoria?: string;
}
