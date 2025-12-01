import { Component, OnInit, ViewChild } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  home, homeOutline,
  wallet, walletOutline,
  swapHorizontal, swapHorizontalOutline,
  cash, cashOutline,
  document, documentOutline,
  settings, settingsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsComponent implements OnInit {
  @ViewChild('tabs', { static: false }) tabs!: IonTabs;
  selectedTab: string = 'dashboard';

  constructor() {
    addIcons({
      home,
      homeOutline,
      wallet,
      walletOutline,
      swapHorizontal,
      swapHorizontalOutline,
      cash,
      cashOutline,
      document,
      documentOutline,
      settings,
      settingsOutline
    });
  }

  ngOnInit() {}

  setCurrentTab() {
    this.selectedTab = this.tabs?.getSelected() || 'home';
  }
}
