import { NgModule } from '@angular/core';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { UserCardComponent } from './user-card/user-card.component';

/**
 * Módulo para componentes compartidos
 *
 * @description
 * Centraliza todos los componentes reutilizables del sistema bancario
 * para facilitar su importación en otros módulos.
 */
@NgModule({
  declarations: [
    SearchFilterComponent,
    UserCardComponent
  ],
  exports: [
    SearchFilterComponent,
    UserCardComponent
  ],
  imports: []
})
export class SharedModule { }