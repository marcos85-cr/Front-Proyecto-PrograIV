import { Component, OnInit, ViewChild } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, homeOutline,cash, cashOutline, card, cardOutline, settings, settingsOutline, wallet, walletOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]

})
export class TabsComponent  implements OnInit {
  @ViewChild('tabs', {static: false}) tabs!: IonTabs;
  selectedTab: any;

  constructor() {
    addIcons({
      home,
      homeOutline,
      cash,
      cashOutline,
      card,
      cardOutline,
      settings,
      settingsOutline,
      wallet,
      walletOutline
    });
  }

  ngOnInit() {
  }

  setCurrentTab() {
    this.selectedTab = this.tabs?.getSelected();
    console.log(this.selectedTab);
  }

}
