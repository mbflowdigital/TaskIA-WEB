import { RouteInfo } from './vertical-menu.metadata';

//Sidebar menu Routes and data
export const ROUTES: RouteInfo[] = [
  {
    path: '/page', title: 'Page', icon: 'ft-home', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: []
  },
  {
    path: '', title: 'Projetos', icon: 'ft-briefcase', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false,
    submenu: [
      { path: '/projects', title: 'Listagem', icon: 'ft-list submenu-icon', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
      // projetos da API são injetados dinamicamente pelo VerticalMenuComponent
    ]
  },
  {
    path: '', title: 'Administração', icon: 'ft-settings', class: 'has-sub', badge: '', badgeClass: '', isExternalLink: false,
    submenu: [
      { path: '/users', title: 'Usuários', icon: 'ft-users submenu-icon', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
      { path: '/companies', title: 'Empresas', icon: 'ft-briefcase submenu-icon', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    ]
  },
];
