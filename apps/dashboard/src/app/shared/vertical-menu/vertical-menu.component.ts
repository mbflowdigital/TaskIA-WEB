import {
  Component, OnInit, ViewChild, OnDestroy,
  ElementRef, AfterViewInit, ChangeDetectorRef, HostListener
} from "@angular/core";
import { ROUTES } from './vertical-menu-routes.config';
import { HROUTES } from '../horizontal-menu/navigation-routes.config';
import { RouteInfo } from './vertical-menu.metadata';

import { Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { customAnimations } from "../animations/custom-animations";
import { DeviceDetectorService } from 'ngx-device-detector';
import { ConfigService } from '../services/config.service';
import { Subscription } from 'rxjs';
import { LayoutService } from '../services/layout.service';
import { ProjectsApiService } from 'app/shared/api/projects-api.service';
import { AuthSessionService } from 'app/shared/auth/auth-session.service';

@Component({
  selector: "app-sidebar",
  templateUrl: "./vertical-menu.component.html",
  animations: customAnimations
})
export class VerticalMenuComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('toggleIcon') toggleIcon: ElementRef;
  public menuItems: any[];
  level: number = 0;
  logoUrl = 'assets/img/ai-logo.png';
  public config: any = {};
  protected innerWidth: any;
  layoutSub: Subscription;
  configSub: Subscription;
  perfectScrollbarEnable = true;
  collapseSidebar = false;
  resizeTimeout;
  private projectsSubmenu: RouteInfo[] = [];

  constructor(
    private router: Router,
    public translate: TranslateService,
    private layoutService: LayoutService,
    private configService: ConfigService,
    private cdr: ChangeDetectorRef,
    private deviceService: DeviceDetectorService,
    private projectsApiService: ProjectsApiService,
    private authSession: AuthSessionService
  ) {
    this.config = this.configService.templateConf;
    this.innerWidth = window.innerWidth;
    this.isTouchDevice();
  }


  ngOnInit() {
    this.menuItems = JSON.parse(JSON.stringify(ROUTES));
    this.applyRoleVisibility();
    this.loadProjects();
  }

  private applyRoleVisibility(): void {
    const role = this.authSession.getRole().trim().toUpperCase();
    const canSeeUsers = role === 'ADM' || role === 'ADM_MASTER';
    const isAdm = role === 'ADM';
    const admCompanyId = isAdm ? (this.authSession.getUser()?.companyId ?? null) : null;

    this.menuItems = this.menuItems
      .map((menu: RouteInfo) => {
        if (!menu.submenu?.length) return menu;

        const filteredSubmenu = menu.submenu
          .map(item => {
            // Para ADM: transforma o link /companies em link direto para a empresa dele
            if (item.path === '/companies' && isAdm && admCompanyId) {
              return { ...item, path: `/companies/${admCompanyId}`, title: 'Minha Empresa' };
            }
            return item;
          })
          .filter(item => {
            if (item.path === '/users') return canSeeUsers;
            if (item.path === '/companies') return role === 'ADM_MASTER';
            if (item.path?.startsWith('/companies/')) return isAdm && !!admCompanyId;
            return true;
          });

        return { ...menu, submenu: filteredSubmenu };
      })
      .filter((menu: RouteInfo) => menu.path || (menu.submenu && menu.submenu.length > 0));
  }

  private loadProjects() {
    this.projectsApiService.getAll().subscribe({
      next: result => {
        if (result?.data?.length) {
          this.projectsSubmenu = result.data
            .filter(p => p.status === 'Active')
            .map(p => ({
              path: p.status === 'Draft' ? `/projects/${p.id}/edit` : `/projects/${p.id}`,
              title: p.name,
              icon: 'ft-folder submenu-icon',
              class: 'project-sub-item',
              badge: '',
              badgeClass: '',
              isExternalLink: false,
              submenu: []
            }));
        } else {
          this.projectsSubmenu = [];
        }
        this.injectProjects();
        this.cdr.markForCheck();
      },
      error: () => {
        this.projectsSubmenu = [];
        this.injectProjects();
        this.cdr.markForCheck();
      }
    });
  }

  private injectProjects() {
    const item = this.menuItems.find(m => m.title === 'Projetos');
    if (item) {
      // mantém o item fixo de listagem e adiciona os projetos da API após
      item.submenu = [
        { path: '/projects', title: 'Listagem', icon: 'ft-list submenu-icon', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
        ...this.projectsSubmenu
      ];
    }

    this.applyRoleVisibility();
  }

  ngAfterViewInit() {

    this.configSub = this.configService.templateConf$.subscribe((templateConf) => {
      if (templateConf) {
        this.config = templateConf;
      }
      this.loadLayout();
      this.cdr.markForCheck();

    });

    this.layoutSub = this.layoutService.overlaySidebarToggle$.subscribe(
      collapse => {
        if (this.config.layout.menuPosition === "Side") {
          this.collapseSidebar = collapse;
        }
      });

  }


  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {
      if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout((() => {
        this.innerWidth = event.target.innerWidth;
          this.loadLayout();
      }).bind(this), 500);
  }

  loadLayout() {

    if (this.config.layout.menuPosition === "Top") { // Horizontal Menu
      if (this.innerWidth < 1200) { // Screen size < 1200
        this.menuItems = HROUTES;
      }
    }
    else if (this.config.layout.menuPosition === "Side") { // Vertical Menu{
      this.menuItems = JSON.parse(JSON.stringify(ROUTES));
      this.injectProjects();
    }




    this.logoUrl = 'assets/img/ai-logo.png';

    if(this.config.layout.sidebar.collapsed) {
      this.collapseSidebar = true;
    }
    else {
      this.collapseSidebar = false;
    }
  }

  toggleSidebar() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = !this.config.layout.sidebar.collapsed;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });

    setTimeout(() => {
      this.fireRefreshEventOnWindow();
    }, 300);
  }

  fireRefreshEventOnWindow = function () {
    const evt = document.createEvent("HTMLEvents");
    evt.initEvent("resize", true, false);
    window.dispatchEvent(evt);
  };

  CloseSidebar() {
    this.layoutService.toggleSidebarSmallScreen(false);
  }

  isTouchDevice() {

    const isMobile = this.deviceService.isMobile();
    const isTablet = this.deviceService.isTablet();

    if (isMobile || isTablet) {
      this.perfectScrollbarEnable = false;
    }
    else {
      this.perfectScrollbarEnable = true;
    }

  }


  ngOnDestroy() {
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
    if (this.configSub) {
      this.configSub.unsubscribe();
    }

  }

}
