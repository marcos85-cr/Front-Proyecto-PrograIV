import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class SearchFilterComponent {
  /** Término de búsqueda */
  @Input({ required: true }) searchTerm: string = '';

  /** Valor actual del filtro */
  @Input({ required: true }) filterValue: any = null;

  /** Placeholder para la barra de búsqueda */
  @Input() placeholder: string = 'Buscar...';

  /** Opciones para el filtro segmentado */
  @Input() filterOptions: Array<{ value: any; label: string }> = [];

  /** Evento emitido cuando el término de búsqueda cambia */
  @Output() searchTermChange = new EventEmitter<string>();

  /** Evento emitido cuando el filtro cambia */
  @Output() filterChange = new EventEmitter<any>();

  /** Maneja el cambio en el término de búsqueda */
  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChange.emit(value);
  }

  /** Maneja el cambio en el filtro */
  onFilterChange(value: any): void {
    this.filterValue = value;
    this.filterChange.emit(value);
  }
}
