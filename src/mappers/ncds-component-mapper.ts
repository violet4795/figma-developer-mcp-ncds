import type { SimplifiedNode } from "~/extractors/types.js";

export interface NcdsComponentMapping {
  component: string;
  props: Record<string, any>;
  htmlTag: string;
  className: string;
  children?: NcdsComponentMapping[];
}

export interface ComponentMappingRule {
  condition: (node: SimplifiedNode) => boolean;
  mapper: (node: SimplifiedNode) => NcdsComponentMapping;
}

// NCDS UI Admin 컴포넌트 매핑 규칙들
export const NCDS_COMPONENT_RULES: ComponentMappingRule[] = [
  // Button 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return (
        node.type === 'INSTANCE' ||
        (node.type === 'FRAME' && 
         (name.includes('button') || name.includes('btn') || 
          name.includes('click') || name.includes('submit')))
      );
    },
    mapper: (node) => ({
      component: 'Button',
      props: {
        label: node.text || node.name,
        hierarchy: inferButtonTheme(node),
        size: inferSize(node),
        disabled: node.name.toLowerCase().includes('disabled')
      },
      htmlTag: 'button',
      className: 'ncua-btn'
    })
  },

  // Input 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('input') || name.includes('field') || 
              name.includes('text') && !name.includes('label'));
    },
    mapper: (node) => ({
      component: 'InputBase',
      props: {
        placeholder: node.text || 'Enter text...',
        size: inferSize(node),
        disabled: node.name.toLowerCase().includes('disabled'),
        required: node.name.toLowerCase().includes('required')
      },
      htmlTag: 'input',
      className: 'ncua-input'
    })
  },

  // Checkbox 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('checkbox') || name.includes('check'));
    },
    mapper: (node) => ({
      component: 'Checkbox',
      props: {
        label: node.text || node.name,
        checked: node.name.toLowerCase().includes('checked'),
        disabled: node.name.toLowerCase().includes('disabled')
      },
      htmlTag: 'label',
      className: 'ncua-checkbox'
    })
  },

  // Radio 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && name.includes('radio');
    },
    mapper: (node) => ({
      component: 'Radio',
      props: {
        label: node.text || node.name,
        checked: node.name.toLowerCase().includes('selected'),
        disabled: node.name.toLowerCase().includes('disabled')
      },
      htmlTag: 'label',
      className: 'ncua-radio'
    })
  },

  // Select/Dropdown 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('select') || name.includes('dropdown') || name.includes('combo'));
    },
    mapper: (node) => ({
      component: 'Select',
      props: {
        placeholder: node.text || 'Select an option',
        size: inferSize(node),
        disabled: node.name.toLowerCase().includes('disabled')
      },
      htmlTag: 'select',
      className: 'ncua-select'
    })
  },

  // Badge 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return (node.type === 'FRAME' || node.type === 'TEXT') && 
             (name.includes('badge') || name.includes('tag') || name.includes('chip'));
    },
    mapper: (node) => ({
      component: 'Badge',
      props: {
        label: node.text || node.name,
        color: inferBadgeColor(node),
        size: inferSize(node)
      },
      htmlTag: 'span',
      className: 'ncua-badge'
    })
  },

  // Modal 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('modal') || name.includes('dialog') || name.includes('popup'));
    },
    mapper: (node) => ({
      component: 'Modal',
      props: {
        isOpen: true,
        title: findChildText(node, 'title') || 'Modal Title'
      },
      htmlTag: 'div',
      className: 'ncua-modal'
    })
  },

  // Tab 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('tab') && !name.includes('table'));
    },
    mapper: (node) => ({
      component: 'HorizontalTab',
      props: {
        tabs: extractTabItems(node)
      },
      htmlTag: 'div',
      className: 'ncua-tab'
    })
  },

  // Pagination 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('pagination') || name.includes('pager'));
    },
    mapper: (node) => ({
      component: 'Pagination',
      props: {
        currentPage: 1,
        totalPages: 10,
        size: inferSize(node)
      },
      htmlTag: 'nav',
      className: 'ncua-pagination'
    })
  },

  // Progress Bar 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('progress') && name.includes('bar'));
    },
    mapper: (node) => ({
      component: 'ProgressBar',
      props: {
        progress: 50,
        size: inferSize(node)
      },
      htmlTag: 'div',
      className: 'ncua-progress-bar'
    })
  },

  // Notification 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('notification') || name.includes('alert') || name.includes('toast'));
    },
    mapper: (node) => ({
      component: 'Notification',
      props: {
        title: findChildText(node, 'title') || 'Notification',
        description: findChildText(node, 'description') || node.text,
        type: inferNotificationType(node)
      },
      htmlTag: 'div',
      className: 'ncua-notification'
    })
  },

  // VerticalTab 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('vertical') && name.includes('tab'));
    },
    mapper: (node) => ({
      component: 'VerticalTab',
      props: {
        tabs: extractTabItems(node),
        type: 'button-primary'
      },
      htmlTag: 'div',
      className: 'ncua-vertical-tab'
    })
  },

  // ProgressCircle 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('progress') && (name.includes('circle') || name.includes('circular')));
    },
    mapper: (node) => ({
      component: 'ProgressCircle',
      props: {
        progress: 50,
        size: inferSize(node)
      },
      htmlTag: 'div',
      className: 'ncua-progress-circle'
    })
  },

  // Spinner 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('spinner') || name.includes('loading') || name.includes('loader'));
    },
    mapper: (node) => ({
      component: 'Spinner',
      props: {
        size: inferSize(node),
        text: node.text
      },
      htmlTag: 'div',
      className: 'ncua-spinner'
    })
  },

  // Tag 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return (node.type === 'FRAME' || node.type === 'TEXT') && 
             (name.includes('tag') && !name.includes('stage'));
    },
    mapper: (node) => ({
      component: 'Tag',
      props: {
        label: node.text || node.name,
        color: inferTagColor(node),
        size: inferSize(node)
      },
      htmlTag: 'span',
      className: 'ncua-tag'
    })
  },

  // Toggle 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('toggle') || name.includes('switch'));
    },
    mapper: (node) => ({
      component: 'Toggle',
      props: {
        checked: node.name.toLowerCase().includes('on'),
        disabled: node.name.toLowerCase().includes('disabled'),
        size: inferSize(node),
        text: node.text
      },
      htmlTag: 'label',
      className: 'ncua-toggle'
    })
  },

  // Tooltip 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && name.includes('tooltip');
    },
    mapper: (node) => ({
      component: 'Tooltip',
      props: {
        title: findChildText(node, 'title') || node.text,
        position: 'top'
      },
      htmlTag: 'span',
      className: 'ncua-tooltip'
    })
  },

  // Slider 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('slider') || name.includes('range'));
    },
    mapper: (node) => ({
      component: 'Slider',
      props: {
        value: 50,
        min: 0,
        max: 100,
        size: inferSize(node)
      },
      htmlTag: 'div',
      className: 'ncua-slider'
    })
  },

  // BreadCrumb 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('breadcrumb') || name.includes('bread'));
    },
    mapper: (node) => ({
      component: 'BreadCrumb',
      props: {
        items: [{ label: 'Home', href: '/' }, { label: 'Current', href: '#' }]
      },
      htmlTag: 'nav',
      className: 'ncua-breadcrumb'
    })
  },

  // Divider 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return (node.type === 'FRAME' || node.type === 'LINE') && 
             (name.includes('divider') || name.includes('separator') || name.includes('line'));
    },
    mapper: (node) => ({
      component: 'Divider',
      props: {
        orientation: node.layout?.width > node.layout?.height ? 'horizontal' : 'vertical',
        text: node.text
      },
      htmlTag: 'hr',
      className: 'ncua-divider'
    })
  },

  // Dropdown 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('dropdown') && !name.includes('select'));
    },
    mapper: (node) => ({
      component: 'Dropdown',
      props: {
        label: node.text || 'Dropdown',
        items: extractDropdownItems(node)
      },
      htmlTag: 'div',
      className: 'ncua-dropdown'
    })
  },

  // EmptyState 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return node.type === 'FRAME' && 
             (name.includes('empty') || name.includes('no-data') || name.includes('no-result'));
    },
    mapper: (node) => ({
      component: 'EmptyState',
      props: {
        title: findChildText(node, 'title') || 'No Data',
        description: findChildText(node, 'description') || node.text
      },
      htmlTag: 'div',
      className: 'ncua-empty-state'
    })
  },

  // FeaturedIcon 매핑
  {
    condition: (node) => {
      const name = node.name.toLowerCase();
      return (node.type === 'FRAME' || node.type === 'COMPONENT') && 
             (name.includes('icon') || name.includes('featured'));
    },
    mapper: (node) => ({
      component: 'FeaturedIcon',
      props: {
        name: 'star',
        size: inferSize(node),
        color: inferIconColor(node),
        theme: 'light'
      },
      htmlTag: 'div',
      className: 'ncua-featured-icon'
    })
  }
];

// Helper functions
function inferButtonTheme(node: SimplifiedNode): string {
  const name = node.name.toLowerCase();
  
  if (name.includes('primary')) return 'primary';
  if (name.includes('secondary')) return 'secondary';
  if (name.includes('destructive') || name.includes('danger') || name.includes('delete')) return 'destructive';
  if (name.includes('link')) return 'link';
  if (name.includes('tertiary')) return 'tertiary';
  if (name.includes('gray')) return 'secondary-gray';
  
  return 'primary';
}

function inferSize(node: SimplifiedNode): string {
  if (!node.layout) return 'md';
  
  // 레이아웃 ID로부터 실제 크기 정보를 추정
  // 실제 구현에서는 globalVars를 통해 정확한 크기를 가져올 수 있습니다
  const name = node.name.toLowerCase();
  
  if (name.includes('xxs') || name.includes('tiny')) return 'xxs';
  if (name.includes('xs') || name.includes('small')) return 'xs';
  if (name.includes('sm')) return 'sm';
  if (name.includes('lg') || name.includes('large')) return 'lg';
  if (name.includes('xl') || name.includes('xlarge')) return 'xl';
  if (name.includes('2xl') || name.includes('xxlarge')) return '2xl';
  
  return 'md';
}

function inferBadgeColor(node: SimplifiedNode): string {
  const name = node.name.toLowerCase();
  
  if (name.includes('success') || name.includes('green')) return 'success';
  if (name.includes('warning') || name.includes('yellow')) return 'warning';
  if (name.includes('error') || name.includes('red')) return 'error';
  if (name.includes('info') || name.includes('blue')) return 'info';
  
  return 'default';
}

function inferNotificationType(node: SimplifiedNode): string {
  const name = node.name.toLowerCase();
  
  if (name.includes('success')) return 'success';
  if (name.includes('warning')) return 'warning';
  if (name.includes('error') || name.includes('danger')) return 'error';
  if (name.includes('info')) return 'info';
  
  return 'info';
}

function findChildText(node: SimplifiedNode, type: string): string | undefined {
  if (!node.children) return undefined;
  
  const child = node.children.find(child => 
    child.name.toLowerCase().includes(type) && child.text
  );
  
  return child?.text;
}

function extractTabItems(node: SimplifiedNode): Array<{ label: string; isActive?: boolean }> {
  if (!node.children) return [];
  
  return node.children
    .filter(child => child.type === 'TEXT' || child.text)
    .map(child => ({
      label: child.text || child.name,
      isActive: child.name.toLowerCase().includes('active')
    }));
}

function extractDropdownItems(node: SimplifiedNode): Array<{ label: string; value: string }> {
  if (!node.children) return [{ label: '옵션 1', value: '1' }, { label: '옵션 2', value: '2' }];
  
  return node.children
    .filter(child => child.text)
    .map((child, index) => ({
      label: child.text || `옵션 ${index + 1}`,
      value: `${index + 1}`
    }));
}

function inferTagColor(node: SimplifiedNode): string {
  const name = node.name.toLowerCase();
  
  if (name.includes('success') || name.includes('green')) return 'success';
  if (name.includes('warning') || name.includes('yellow')) return 'warning';
  if (name.includes('error') || name.includes('red')) return 'error';
  if (name.includes('info') || name.includes('blue')) return 'info';
  if (name.includes('primary')) return 'primary';
  
  return 'gray';
}

function inferIconColor(node: SimplifiedNode): string {
  const name = node.name.toLowerCase();
  
  if (name.includes('primary') || name.includes('red')) return 'primary';
  if (name.includes('success') || name.includes('green')) return 'success';
  if (name.includes('warning') || name.includes('yellow')) return 'warning';
  if (name.includes('error') || name.includes('danger')) return 'error';
  if (name.includes('info') || name.includes('blue')) return 'info';
  
  return 'gray';
}

// 메인 매핑 함수
export function mapToNcdsComponent(node: SimplifiedNode): NcdsComponentMapping | null {
  for (const rule of NCDS_COMPONENT_RULES) {
    if (rule.condition(node)) {
      return rule.mapper(node);
    }
  }
  
  return null;
}

// 컴포넌트 매핑 결과를 검증하는 함수
export function validateNcdsMapping(mapping: NcdsComponentMapping): boolean {
  const validComponents = [
    'Button', 'InputBase', 'Checkbox', 'Radio', 'Select', 'Badge', 'Modal',
    'HorizontalTab', 'VerticalTab', 'Pagination', 'ProgressBar', 'ProgressCircle',
    'Notification', 'Spinner', 'Tag', 'Tooltip', 'Slider', 'Toggle',
    'BreadCrumb', 'Divider', 'Dropdown', 'EmptyState', 'FeaturedIcon'
  ];
  
  return validComponents.includes(mapping.component);
}