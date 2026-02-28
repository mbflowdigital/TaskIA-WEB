import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PageRoutingModule } from "./page-routing.module";

import { PageComponent } from "./page.component";


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageRoutingModule
  ],
  exports: [],
  declarations: [
    PageComponent
  ],
  providers: [],
})
export class PageModule { }
