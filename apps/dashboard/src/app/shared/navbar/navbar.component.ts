import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit, ChangeDetectorRef, Inject, Renderer2, ViewChild, ElementRef, ViewChildren, QueryList, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from '../services/config.service';
import { DOCUMENT } from '@angular/common';
import { CustomizerService } from '../services/customizer.service';
import { UntypedFormControl } from '@angular/forms';
import { LISTITEMS } from '../data/template-search';
import { Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthRefreshService } from '../auth/auth-refresh.service';
import { UsersApiService } from '../api/users-api.service';

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"]
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  currentLang = "pt-BR";
  selectedLanguageText = "Português";
  toggleClass = "ft-maximize";
  placement = "bottom-right";
  logoUrl = 'assets/img/ai-logo.png';
  menuPosition = 'Side';
  isSmallScreen = false;
  protected innerWidth: any;
  searchOpenClass = "";
  transparentBGClass = "";
  hideSidebar: boolean = true;
  public isCollapsed = true;
  userName = 'Usuario';
  userAvatar: string | null = null;
  layoutSub: Subscription;
  configSub: Subscription;
  avatarSub: Subscription;
  nameSub: Subscription;
  private destroy$ = new Subject<void>();

  @ViewChild('search') searchElement: ElementRef;
  @ViewChildren('searchResults') searchResults: QueryList<any>;

  @Output()
  toggleHideSidebar = new EventEmitter<Object>();

  @Output()
  seachTextEmpty = new EventEmitter<boolean>();

  listItems = [];
  control = new UntypedFormControl();

  public config: any = {};

  constructor(public translate: TranslateService,
    private layoutService: LayoutService,
    private router: Router,
    private authSessionService: AuthSessionService,
    private authRefreshService: AuthRefreshService,
    private configService: ConfigService, 
    private cdr: ChangeDetectorRef,
    private usersApi: UsersApiService) {

    const initialLang = this.translate.currentLang || this.translate.getDefaultLang() || 'pt-BR';
    this.currentLang = initialLang;
    this.setLanguageUi(initialLang);
    this.config = this.configService.templateConf;
    this.innerWidth = window.innerWidth;

    this.layoutSub = layoutService.toggleSidebar$.subscribe(
      isShow => {
        this.hideSidebar = !isShow;
      });

  }

  ngOnInit() {
    this.listItems = LISTITEMS;
    const sessionUser = this.authSessionService.getUser();
    
    // Carregar imagem de perfil diretamente do banco
    if (sessionUser?.userId) {
      this.loadUserProfileImage(sessionUser.userId);
    }
    
    this.authSessionService.loadUserName();
    this.nameSub = this.authSessionService.userName$.subscribe(name => {
      this.userName = name || 'Usuario';
      this.cdr.markForCheck();
    });

    if (this.innerWidth < 1200) {
      this.isSmallScreen = true;
    }
    else {
      this.isSmallScreen = false;
    }
  }

  ngAfterViewInit() {

    this.configSub = this.configService.templateConf$.subscribe((templateConf) => {
      if (templateConf) {
        this.config = templateConf;
      }
      this.loadLayout();
      this.cdr.markForCheck();

    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Liberar URL do avatar se existir
    if (this.userAvatar && this.userAvatar.startsWith('blob:')) {
      URL.revokeObjectURL(this.userAvatar);
    }
    
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
    if (this.configSub) {
      this.configSub.unsubscribe();
    }
    if (this.avatarSub) {
      this.avatarSub.unsubscribe();
    }
    if (this.nameSub) {
      this.nameSub.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = event.target.innerWidth;
    if (this.innerWidth < 1200) {
      this.isSmallScreen = true;
    }
    else {
      this.isSmallScreen = false;
    }
  }

  loadLayout() {

    if (this.config.layout.menuPosition && this.config.layout.menuPosition.toString().trim() != "") {
      this.menuPosition = this.config.layout.menuPosition;
    }

    this.logoUrl = 'assets/img/ai-logo.png';

    if (this.config.layout.variant === "Transparent") {
      this.transparentBGClass = this.config.layout.sidebar.backgroundColor;
    }
    else {
      this.transparentBGClass = "";
    }

  }

  onSearchKey(event: any) {
    if (this.searchResults && this.searchResults.length > 0) {
      this.searchResults.first.host.nativeElement.classList.add('first-active-item');
    }

    if (event.target.value === "") {
      this.seachTextEmpty.emit(true);
    }
    else {
      this.seachTextEmpty.emit(false);
    }
  }

  removeActiveClass() {
    if (this.searchResults && this.searchResults.length > 0) {
      this.searchResults.first.host.nativeElement.classList.remove('first-active-item');
    }
  }

  onEscEvent() {
    this.control.setValue("");
    this.searchOpenClass = '';
    this.seachTextEmpty.emit(true);
  }

  onEnter() {
    if (this.searchResults && this.searchResults.length > 0) {
      let url = this.searchResults.first.url;
      if (url && url != '') {
        this.control.setValue("");
        this.searchOpenClass = '';
        this.router.navigate([url]);
        this.seachTextEmpty.emit(true);
      }
    }
  }

  redirectTo(value) {
    this.router.navigate([value]);
    this.seachTextEmpty.emit(true);
  }


  ChangeLanguage(language: string) {
    this.currentLang = language;
    this.translate.use(language);
    this.setLanguageUi(language);
  }

  /**
   * Carrega a imagem de perfil do usuário diretamente do banco
   */
  private loadUserProfileImage(userId: string): void {
    this.usersApi.getProfileImageBlob(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            // Liberar URL anterior se existir
            if (this.userAvatar && this.userAvatar.startsWith('blob:')) {
              URL.revokeObjectURL(this.userAvatar);
            }
            
            this.userAvatar = URL.createObjectURL(blob);
            this.cdr.markForCheck();
          } else {
            this.userAvatar = null;
          }
        },
        error: () => {
          this.userAvatar = null;
          this.cdr.markForCheck();
        }
      });
  }

  private setLanguageUi(language: string): void {
    if (language === 'pt-BR' || language === 'pt') {
      this.selectedLanguageText = 'Português (Brasil)';
      return;
    }
    if (language === 'en') {
      this.selectedLanguageText = 'Inglês';
      return;
    }
    if (language === 'es') {
      this.selectedLanguageText = 'Espanhol';
      return;
    }
    if (language === 'de') {
      this.selectedLanguageText = 'Alemão';
      return;
    }

    this.selectedLanguageText = 'Português (Brasil)';
  }

  ToggleClass() {
    if (this.toggleClass === "ft-maximize") {
      this.toggleClass = "ft-minimize";
    } else {
      this.toggleClass = "ft-maximize";
    }
  }

  toggleSearchOpenClass(display) {
    this.control.setValue("");
    if (display) {
      this.searchOpenClass = 'open';
      setTimeout(() => {
        this.searchElement.nativeElement.focus();
      }, 0);
    }
    else {
      this.searchOpenClass = '';
    }
    this.seachTextEmpty.emit(true);



  }



  toggleNotificationSidebar() {
    this.layoutService.toggleNotificationSidebar(true);
  }

  toggleSidebar() {
    this.layoutService.toggleSidebarSmallScreen(this.hideSidebar);
  }

  logout(): void {
    this.authRefreshService.stopMonitoring();
    this.authSessionService.clear();
    this.router.navigate(['/pages/login']);
  }
}
