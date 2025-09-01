import type { SimplifiedNode, SimplifiedDesign, GlobalVars } from "~/extractors/types.js";
import { mapToNcdsComponent, validateNcdsMapping, type NcdsComponentMapping } from "~/mappers/ncds-component-mapper.js";

export interface NcdsHtmlGenerationOptions {
  includeCSS?: boolean;
  includeComments?: boolean;
  phpNamingConvention?: boolean;
  generateNcdsImports?: boolean;
  wrapInContainer?: boolean;
}

export interface GeneratedNcdsHtml {
  html: string;
  css?: string;
  imports?: string[];
  componentUsage?: Record<string, number>;
}

export class NcdsHtmlGenerator {
  private globalVars: GlobalVars;
  private options: NcdsHtmlGenerationOptions;
  private usedComponents: Set<string> = new Set();
  private componentCounter: Record<string, number> = {};

  constructor(globalVars: GlobalVars, options: NcdsHtmlGenerationOptions = {}) {
    this.globalVars = globalVars;
    this.options = {
      includeCSS: true,
      includeComments: true,
      phpNamingConvention: true,
      generateNcdsImports: true,
      wrapInContainer: true,
      ...options,
    };
  }

  generateFromDesign(design: SimplifiedDesign): GeneratedNcdsHtml {
    this.usedComponents.clear();
    this.componentCounter = {};

    const html = this.generateNodesHtml(design.nodes);
    const wrappedHtml = this.options.wrapInContainer ? 
      this.wrapInContainer(html) : html;
    
    const imports = this.options.generateNcdsImports ? 
      this.generateImports() : undefined;
    
    const css = this.options.includeCSS ? 
      this.generateNcdsCss() : undefined;

    return {
      html: wrappedHtml,
      css,
      imports,
      componentUsage: { ...this.componentCounter }
    };
  }

  private generateNodesHtml(nodes: SimplifiedNode[]): string {
    return nodes
      .map(node => this.generateNodeHtml(node))
      .filter(html => html.trim() !== '')
      .join('\n');
  }

  private generateNodeHtml(node: SimplifiedNode): string {
    // NCDS 컴포넌트로 매핑 시도
    const ncdsMapping = mapToNcdsComponent(node);
    
    if (ncdsMapping && validateNcdsMapping(ncdsMapping)) {
      return this.generateNcdsComponentHtml(ncdsMapping, node);
    }
    
    // 매핑되지 않는 경우 일반 HTML 태그로 생성
    return this.generateRegularHtml(node);
  }

  private generateNcdsComponentHtml(mapping: NcdsComponentMapping, node: SimplifiedNode): string {
    this.usedComponents.add(mapping.component);
    this.componentCounter[mapping.component] = (this.componentCounter[mapping.component] || 0) + 1;

    const id = this.generateId(node);
    const className = this.generateClassName(mapping);
    const props = this.generateNcdsProps(mapping.props);
    const children = this.generateChildren(node);

    let html = '';
    
    if (this.options.includeComments) {
      html += `<!-- NCDS ${mapping.component}: ${node.name} -->\n`;
    }

    switch (mapping.component) {
      case 'Button':
        html += this.generateButtonHtml(id, className, props, children, node);
        break;
      case 'InputBase':
        html += this.generateInputHtml(id, className, props, node);
        break;
      case 'Checkbox':
        html += this.generateCheckboxHtml(id, className, props, node);
        break;
      case 'Radio':
        html += this.generateRadioHtml(id, className, props, node);
        break;
      case 'Select':
        html += this.generateSelectHtml(id, className, props, node);
        break;
      case 'Badge':
        html += this.generateBadgeHtml(id, className, props, node);
        break;
      case 'Modal':
        html += this.generateModalHtml(id, className, props, children, node);
        break;
      case 'HorizontalTab':
        html += this.generateTabHtml(id, className, props, node);
        break;
      case 'Notification':
        html += this.generateNotificationHtml(id, className, props, node);
        break;
      case 'ProgressBar':
        html += this.generateProgressBarHtml(id, className, props, node);
        break;
      case 'Pagination':
        html += this.generatePaginationHtml(id, className, props, node);
        break;
      case 'VerticalTab':
        html += this.generateVerticalTabHtml(id, className, props, node);
        break;
      case 'ProgressCircle':
        html += this.generateProgressCircleHtml(id, className, props, node);
        break;
      case 'Spinner':
        html += this.generateSpinnerHtml(id, className, props, node);
        break;
      case 'Tag':
        html += this.generateTagHtml(id, className, props, node);
        break;
      case 'Tooltip':
        html += this.generateTooltipHtml(id, className, props, children, node);
        break;
      case 'Slider':
        html += this.generateSliderHtml(id, className, props, node);
        break;
      case 'Toggle':
        html += this.generateToggleHtml(id, className, props, node);
        break;
      case 'BreadCrumb':
        html += this.generateBreadcrumbHtml(id, className, props, node);
        break;
      case 'Divider':
        html += this.generateDividerHtml(id, className, props, node);
        break;
      case 'Dropdown':
        html += this.generateDropdownHtml(id, className, props, children, node);
        break;
      case 'EmptyState':
        html += this.generateEmptyStateHtml(id, className, props, children, node);
        break;
      case 'FeaturedIcon':
        html += this.generateFeaturedIconHtml(id, className, props, node);
        break;
      default:
        html += this.generateGenericComponentHtml(mapping, id, className, props, children);
    }

    return html;
  }

  private generateButtonHtml(id: string, className: string, props: any, children: string, node: SimplifiedNode): string {
    const type = props.type || 'button';
    const size = props.size || 'xs';
    const hierarchy = props.hierarchy || 'primary';
    const disabled = props.disabled ? ' disabled' : '';
    const buttonClass = `ncua-btn ncua-btn--${hierarchy} ncua-btn--${size}`;
    
    let content = props.label || children || node.text || 'Button';
    
    // NCDS UI-Admin 구조에 맞게 label로 감싸기
    content = `<span class="ncua-btn__label">${content}</span>`;
    
    // 아이콘 추가
    if (props.leadingIcon) {
      content = `<i class="ncua-icon">${props.leadingIcon}</i>${content}`;
    }
    if (props.trailingIcon) {
      content = `${content}<i class="ncua-icon">${props.trailingIcon}</i>`;
    }
    
    return `<button${id ? ` id="${id}"` : ''} class="${buttonClass}" type="${type}"${disabled}>${content}</button>`;
  }

  private generateInputHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const type = props.type || 'text';
    const size = props.size || 'xs';
    const placeholder = props.placeholder || '텍스트를 입력하세요';
    const required = props.required ? ' required' : '';
    const disabled = props.disabled ? ' disabled' : '';
    const value = props.value ? ` value="${props.value}"` : '';
    
    // NCDS UI-Admin 실제 구조에 맞게 수정
    return `
<div class="ncua-input ncua-input--${size}">
  <div class="ncua-input__content">
    <div class="ncua-input__field ncua-input__field--${size}">
      <input${id ? ` id="${id}"` : ''} placeholder="${placeholder}" type="${type}"${value}${required}${disabled} />
    </div>
  </div>
</div>`;
  }

  private generateCheckboxHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const checked = props.checked ? ' checked' : '';
    const disabled = props.disabled ? ' disabled' : '';
    const size = props.size || 'xs';
    const label = props.label || node.text || 'Checkbox';
    
    // 실제 NCDS Checkbox 구조
    return `
<label class="ncua-checkbox-field ncua-checkbox-field--${size}${label ? ' has-text' : ''}">
  <span class="ncua-checkbox-input ncua-checkbox-input--${size}${disabled ? ' is-disabled' : ''}">
    <input${id ? ` id="${id}"` : ''} class="ncua-checkbox-field__input" type="checkbox"${checked}${disabled} />
    <span class="ncua-checkbox-input__ico"></span>
  </span>
  ${label ? `<span><span class="ncua-checkbox-field__text">${label}</span></span>` : ''}
</label>`;
  }

  private generateRadioHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const checked = props.checked ? ' checked' : '';
    const disabled = props.disabled ? ' disabled' : '';
    const size = props.size || 'xs';
    const name = props.name || 'radio-group';
    const label = props.label || node.text || 'Radio';
    
    // 실제 NCDS Radio 구조
    return `
<label class="ncua-radio-field ncua-radio-field--${size}${label ? ' has-text' : ''}">
  <span class="ncua-radio-input ncua-radio-input--${size}${disabled ? ' is-disabled' : ''}">
    <input${id ? ` id="${id}"` : ''} class="ncua-radio-field__input" type="radio" name="${name}"${checked}${disabled} />
    <span class="ncua-radio-input__ico"></span>
  </span>
  ${label ? `<span><span class="ncua-radio-field__text">${label}</span></span>` : ''}
</label>`;
  }

  private generateSelectHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const disabled = props.disabled ? ' disabled' : '';
    const required = props.required ? ' required' : '';
    const size = props.size || 'md';
    const placeholder = props.placeholder || 'Select an option';
    const destructive = props.destructive ? ' destructive' : '';
    
    let options = `<option value="" selected>${placeholder}</option>`;
    
    // 자식 노드에서 옵션 추출
    if (node.children) {
      node.children.forEach((child, index) => {
        if (child.text) {
          options += `<option value="${index + 1}">${child.text}</option>`;
        }
      });
    }
    
    // 실제 NCDS Select 구조
    return `
<span class="ncua-select${destructive}">
  <span class="ncua-select__content ncua-select--${size}">
    <select${id ? ` id="${id}"` : ''} class="ncua-select__tag"${disabled}${required}>
      ${options}
    </select>
  </span>
</span>`;
  }

  private generateBadgeHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const label = props.label || node.text || 'Badge';
    const type = props.type || 'filled';
    const color = props.color || 'gray';
    const size = props.size || 'md';
    
    // 실제 NCDS Badge 구조
    return `
<span${id ? ` id="${id}"` : ''} class="ncua-badge ncua-badge--${type} ncua-badge--${color} ncua-badge--${size}">
  <span class="ncua-badge__label">${label}</span>
</span>`;
  }

  private generateModalHtml(id: string, className: string, props: any, children: string, node: SimplifiedNode): string {
    const title = props.title || 'Modal Title';
    const subtitle = props.subtitle || '';
    const content = children || node.text || 'Modal content';
    const size = props.size || 'md';
    
    // 실제 NCDS Modal 구조
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-modal-backdrop">
  <div class="ncua-modal ncua-modal--${size}">
    <div class="ncua-modal__header ncua-modal__header--left ncua-modal__header--close-button">
      <div class="ncua-modal__title">
        <div class="ncua-modal__title-text">${title}</div>
        ${subtitle ? `<div class="ncua-modal__title-subtitle">${subtitle}</div>` : ''}
      </div>
      <button class="ncua-modal__close-button" type="button">&times;</button>
    </div>
    <div class="ncua-modal__header-divider"></div>
    <div class="ncua-modal__content">
      ${content}
    </div>
    <div class="ncua-modal__actions-divider"></div>
    <div class="ncua-modal__actions-wrapper">
      <div class="ncua-modal__actions ncua-modal__actions--horizontal ncua-modal__actions--right">
        <button class="ncua-btn ncua-btn--secondary-gray ncua-btn--sm" type="button">
          <span class="ncua-btn__label">취소</span>
        </button>
        <button class="ncua-btn ncua-btn--primary ncua-btn--sm" type="button">
          <span class="ncua-btn__label">확인</span>
        </button>
      </div>
    </div>
  </div>
</div>`;
  }

  private generateTabHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const tabs = props.tabs || [{ label: '탭 1', isActive: true }, { label: '탭 2', isActive: false }];
    const type = props.type || 'button-primary';
    const size = props.size || 'sm';
    const fullWidth = props.fullWidth || false;
    
    // 실제 NCDS HorizontalTab 구조 (Swiper 없이 간단한 구조로)
    let tabButtons = tabs.map((tab: any, index: number) => {
      const isActive = tab.isActive ? ' is-active' : '';
      return `
        <div class="swiper-slide">
          <button class="ncua-tab-button ncua-tab-button--${type} ncua-tab-button--${size}${isActive}" data-tab="${index}">
            <span class="ncua-tab-button__label">${tab.label}</span>
          </button>
        </div>`;
    }).join('');
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-horizontal-tab ncua-horizontal-tab--${type}${fullWidth ? ' ncua-horizontal-tab--fullWidth' : ''}">
  <div class="swiper" style="overflow: visible;">
    <div class="swiper-wrapper">
      ${tabButtons}
    </div>
  </div>
</div>`;
  }

  private generateNotificationHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const title = props.title || 'Notification';
    const description = props.description || node.text || '';
    const color = props.color || 'neutral';
    
    // 실제 NCDS FloatingNotification 구조
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-floating-notification ncua-floating-notification--${color}" role="alert">
  <div class="ncua-floating-notification__content">
    <div class="ncua-floating-notification__container">
      <div class="ncua-floating-notification__text-container">
        <div class="ncua-floating-notification__title-wrapper">
          <span class="ncua-floating-notification__title">${title}</span>
        </div>
        ${description ? `<span class="ncua-floating-notification__supporting-text">${description}</span>` : ''}
      </div>
    </div>
  </div>
  <button class="ncua-floating-notification__close-button" type="button">&times;</button>
</div>`;
  }

  private generateProgressBarHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const progress = Math.min(Math.max(props.progress || 0, 0), 100);
    const label = props.label || 'none';
    const showValue = props.showValue || false;
    
    // 실제 NCDS ProgressBar 구조
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-progress-bar ncua-progress-bar-${label}">
  <div class="ncua-progress-bar__content">
    <div class="ncua-progress-bar__bar">
      <div class="ncua-progress-bar__fill" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
    </div>
    ${showValue && label === 'right' ? `<span class="ncua-progress-bar__label ncua-progress-bar__label-right">${progress}%</span>` : ''}
  </div>
  ${showValue && label === 'bottom' ? `<span class="ncua-progress-bar__label ncua-progress-bar__label-bottom">${progress}%</span>` : ''}
</div>`;
  }

  private generatePaginationHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const currentPage = props.currentPage || 1;
    const totalPages = props.totalPages || 10;
    const breakPoint = props.breakPoint || 'pc';
    const showJumpButtons = totalPages > 5;
    
    let pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    
    for (let i = start; i <= end; i++) {
      const isActive = i === currentPage ? ' is-current' : '';
      pages.push(`
        <li class="ncua-pagination__item">
          <button class="ncua-pagination__page-num${isActive}">${i}</button>
        </li>`);
    }
    
    // 실제 NCDS Pagination 구조
    return `
<nav${id ? ` id="${id}"` : ''} class="ncua-pagination ncua-pagination--${breakPoint}">
  ${showJumpButtons ? `
    <button class="ncua-pagination__nav-btn ncua-pagination__nav-btn--first" ${currentPage === 1 ? 'disabled' : ''}>
      <span class="ncua-pagination__nav-btn-text">처음</span>
    </button>
    <button class="ncua-pagination__nav-btn ncua-pagination__nav-btn--prev" ${currentPage === 1 ? 'disabled' : ''}>
      <span class="ncua-pagination__nav-btn-text">이전</span>
    </button>` : ''}
  <ul class="ncua-pagination__list">
    ${pages.join('')}
  </ul>
  <p class="ncua-pagination__page-info">
    <em class="ncua-pagination__current-num">${currentPage}</em> / ${totalPages}
  </p>
  ${showJumpButtons ? `
    <button class="ncua-pagination__nav-btn ncua-pagination__nav-btn--next" ${currentPage === totalPages ? 'disabled' : ''}>
      <span class="ncua-pagination__nav-btn-text">다음</span>
    </button>
    <button class="ncua-pagination__nav-btn ncua-pagination__nav-btn--last" ${currentPage === totalPages ? 'disabled' : ''}>
      <span class="ncua-pagination__nav-btn-text">마지막</span>
    </button>` : ''}
</nav>`;
  }

  private generateVerticalTabHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const tabs = props.tabs || [{ id: 'tab1', label: '탭 1', isActive: true }, { id: 'tab2', label: '탭 2', isActive: false }];
    const type = props.type || 'button-primary';
    const breakPoint = props.breakPoint || 'pc';
    
    let tabButtons = tabs.map((tab: any) => {
      const isActive = tab.isActive ? ' is-active' : '';
      return `
        <button class="ncua-tab-button ncua-tab-button--${type} ncua-tab-button--sm${isActive}" data-tab="${tab.id}">
          <span class="ncua-tab-button__label">${tab.label}</span>
        </button>`;
    }).join('');
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-vertical-tab ncua-vertical-tab--${type}">
  <div class="ncua-vertical-tab__list">
    ${tabButtons}
  </div>
</div>`;
  }

  private generateProgressCircleHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const progress = Math.min(Math.max(props.progress || 0, 0), 100);
    const size = props.size || 'md';
    const strokeWidth = props.strokeWidth || 4;
    const radius = 50 - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-progress-circle ncua-progress-circle--${size}">
  <svg class="ncua-progress-circle__svg" viewBox="0 0 100 100">
    <circle class="ncua-progress-circle__bg" cx="50" cy="50" r="${radius}" stroke-width="${strokeWidth}"></circle>
    <circle class="ncua-progress-circle__progress" cx="50" cy="50" r="${radius}" stroke-width="${strokeWidth}" 
            style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};"></circle>
  </svg>
  <div class="ncua-progress-circle__text">${progress}%</div>
</div>`;
  }

  private generateSpinnerHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const size = props.size || 'md';
    const text = props.text || node.text || '';
    const backdrop = props.backdrop || false;
    
    const spinnerContent = `
<div${id ? ` id="${id}"` : ''} class="ncua-spinner ncua-spinner--${size}">
  <div class="ncua-spinner__icon"></div>
  ${text ? `<p class="ncua-spinner__text">${text}</p>` : ''}
</div>`;
    
    if (backdrop) {
      return `
<div class="ncua-spinner-backdrop">
  ${spinnerContent}
</div>`;
    }
    
    return spinnerContent;
  }

  private generateTagHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const label = props.label || node.text || 'Tag';
    const color = props.color || 'gray';
    const size = props.size || 'md';
    const removable = props.removable || false;
    
    return `
<span${id ? ` id="${id}"` : ''} class="ncua-tag ncua-tag--${color} ncua-tag--${size}">
  <span class="ncua-tag__label">${label}</span>
  ${removable ? '<button class="ncua-tag__remove" type="button">&times;</button>' : ''}
</span>`;
  }

  private generateTooltipHtml(id: string, className: string, props: any, children: string, node: SimplifiedNode): string {
    const title = props.title || 'Tooltip';
    const content = props.content || children || node.text || '';
    const position = props.position || 'top';
    const tooltipType = props.tooltipType || 'dark';
    
    return `
<span${id ? ` id="${id}"` : ''} class="ncua-tooltip ncua-tooltip--${position}">
  <span class="ncua-tooltip__trigger">?</span>
  <span class="ncua-tooltip__bg ncua-tooltip__bg--${tooltipType} ncua-tooltip__bg--${position}">
    ${title ? `<span class="ncua-tooltip__title">${title}</span>` : ''}
    ${content ? `<span class="ncua-tooltip__content">${content}</span>` : ''}
  </span>
</span>`;
  }

  private generateSliderHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const value = props.value || 50;
    const min = props.min || 0;
    const max = props.max || 100;
    const size = props.size || 'md';
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-slider ncua-slider--${size}">
  <input class="ncua-slider__input" type="range" min="${min}" max="${max}" value="${value}" />
</div>`;
  }

  private generateToggleHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const checked = props.checked || false;
    const disabled = props.disabled || false;
    const size = props.size || 'md';
    const text = props.text || node.text || '';
    
    return `
<label class="ncua-toggle ncua-toggle--${size}${disabled ? ' is-disabled' : ''}">
  <input${id ? ` id="${id}"` : ''} class="ncua-toggle__input" type="checkbox"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''} />
  <span class="ncua-toggle__switch"></span>
  ${text ? `<span class="ncua-toggle__text">${text}</span>` : ''}
</label>`;
  }

  private generateBreadcrumbHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const items = props.items || [{ label: 'Home', href: '/' }, { label: 'Page', href: '/page' }];
    
    let breadcrumbItems = items.map((item: any, index: number) => {
      const isLast = index === items.length - 1;
      return `
        <li class="ncua-breadcrumb__item">
          ${isLast ? 
            `<span class="ncua-breadcrumb__current">${item.label}</span>` :
            `<a class="ncua-breadcrumb__link" href="${item.href || '#'}">${item.label}</a>`
          }
        </li>`;
    }).join('');
    
    return `
<nav${id ? ` id="${id}"` : ''} class="ncua-breadcrumb">
  <ol class="ncua-breadcrumb__list">
    ${breadcrumbItems}
  </ol>
</nav>`;
  }

  private generateDividerHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const orientation = props.orientation || 'horizontal';
    const text = props.text || node.text || '';
    
    if (text) {
      return `
<div${id ? ` id="${id}"` : ''} class="ncua-divider ncua-divider--${orientation} ncua-divider--text">
  <span class="ncua-divider__text">${text}</span>
</div>`;
    }
    
    return `<hr${id ? ` id="${id}"` : ''} class="ncua-divider ncua-divider--${orientation}" />`;
  }

  private generateDropdownHtml(id: string, className: string, props: any, children: string, node: SimplifiedNode): string {
    const label = props.label || 'Dropdown';
    const items = props.items || [{ label: '옵션 1', value: '1' }, { label: '옵션 2', value: '2' }];
    
    let dropdownItems = items.map((item: any) => 
      `<li class="ncua-dropdown__item">
        <button class="ncua-dropdown__button" type="button" data-value="${item.value}">${item.label}</button>
      </li>`
    ).join('');
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-dropdown">
  <button class="ncua-dropdown__trigger" type="button">${label}</button>
  <ul class="ncua-dropdown__menu">
    ${dropdownItems}
  </ul>
</div>`;
  }

  private generateEmptyStateHtml(id: string, className: string, props: any, children: string, node: SimplifiedNode): string {
    const title = props.title || 'Empty State';
    const description = props.description || children || node.text || '';
    const iconName = props.iconName || 'inbox';
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-empty-state">
  <div class="ncua-empty-state__icon">
    <svg class="ncua-featured-icon ncua-featured-icon--xl ncua-featured-icon--gray-modern" viewBox="0 0 24 24">
      <path d="M3 3h18v18H3V3z" stroke="currentColor" fill="none"/>
    </svg>
  </div>
  <div class="ncua-empty-state__content">
    <h3 class="ncua-empty-state__title">${title}</h3>
    ${description ? `<p class="ncua-empty-state__description">${description}</p>` : ''}
  </div>
</div>`;
  }

  private generateFeaturedIconHtml(id: string, className: string, props: any, node: SimplifiedNode): string {
    const name = props.name || 'star';
    const size = props.size || 'md';
    const color = props.color || 'primary';
    const theme = props.theme || 'light';
    
    return `
<div${id ? ` id="${id}"` : ''} class="ncua-featured-icon ncua-featured-icon--${size} ncua-featured-icon--${color}-${theme}">
  <svg viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
  </svg>
</div>`;
  }

  private generateGenericComponentHtml(mapping: NcdsComponentMapping, id: string, className: string, props: any, children: string): string {
    const tag = mapping.htmlTag || 'div';
    return `<${tag} id="${id}" class="${className}">${children}</${tag}>`;
  }

  private generateRegularHtml(node: SimplifiedNode): string {
    const tag = this.getHtmlTag(node);
    const id = this.generateId(node);
    const className = this.generateRegularClassName(node);
    const styles = this.generateInlineStyles(node);
    const children = this.generateChildren(node);
    
    const attributes = [
      id ? `id="${id}"` : '',
      className ? `class="${className}"` : '',
      styles ? `style="${styles}"` : ''
    ].filter(Boolean).join(' ');

    let content = '';
    if (node.text) {
      content = node.text;
    }
    if (children) {
      content += children;
    }

    const openTag = `<${tag}${attributes ? ` ${attributes}` : ''}>`;
    const closeTag = `</${tag}>`;

    return `${openTag}${content}${closeTag}`;
  }

  private getHtmlTag(node: SimplifiedNode): string {
    switch (node.type) {
      case 'TEXT': return 'span';
      case 'FRAME':
      case 'GROUP': return 'div';
      case 'RECTANGLE': return 'div';
      case 'ELLIPSE': return 'div';
      case 'IMAGE': return 'img';
      default: return 'div';
    }
  }

  private generateId(node: SimplifiedNode): string {
    if (this.options.phpNamingConvention) {
      return this.toPhpNaming(node.name);
    }
    return node.id;
  }

  private generateClassName(mapping: NcdsComponentMapping): string {
    const baseClass = mapping.className;
    const sizeClass = mapping.props.size ? `${mapping.className}--${mapping.props.size}` : '';
    const themeClass = mapping.props.hierarchy ? `${mapping.className}--${mapping.props.hierarchy}` : '';
    
    return [baseClass, sizeClass, themeClass]
      .filter(Boolean)
      .join(' ');
  }

  private generateRegularClassName(node: SimplifiedNode): string {
    return `figma-${node.type.toLowerCase()}`;
  }

  private generateNcdsProps(props: Record<string, any>): Record<string, any> {
    // Props를 HTML 속성으로 변환
    return props;
  }

  private generateChildren(node: SimplifiedNode): string {
    if (!node.children || node.children.length === 0) {
      return '';
    }
    return this.generateNodesHtml(node.children);
  }

  private generateInlineStyles(node: SimplifiedNode): string {
    // 기본 스타일 생성 로직 (간소화됨)
    const styles: string[] = [];
    
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.push(`opacity: ${node.opacity}`);
    }
    
    if (node.borderRadius) {
      styles.push(`border-radius: ${node.borderRadius}`);
    }
    
    return styles.join('; ');
  }

  private generateImports(): string[] {
    return Array.from(this.usedComponents);
  }

  private generateNcdsCss(): string {
    return `
/* NCDS UI Admin Essential Resources */
<link rel="stylesheet" href="https://fe-sdk.cdn-nhncommerce.com/@ncds/ui-admin/1.0/main.min.css" />
<script type="text/javascript" src="https://fe-sdk.cdn-nhncommerce.com/@ncds/ui-admin/1.0/main.min.js"></script>

/* NCDS UI Admin CSS Import */
@import '@ncds/ui-admin/dist/ui-admin/assets/styles/style.css';

/* Custom styles for generated components */
.figma-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Additional styles for better component display */
.ncua-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.swiper {
  overflow: visible !important;
}

.swiper-wrapper {
  display: flex;
  gap: 8px;
}

.swiper-slide {
  width: auto;
}
    `;
  }

  private wrapInContainer(html: string): string {
    return `<div class="figma-container">\n${html}\n</div>`;
  }

  private toPhpNaming(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

}