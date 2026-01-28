/**
 * SISTEMA DE DESIGN - ESTILOS PADRONIZADOS
 *
 * Este arquivo centraliza todos os estilos de formulários e componentes
 * para garantir consistência visual em todo o aplicativo.
 */

import type { CSSProperties } from 'react'

// =====================================================
// LABELS
// =====================================================

/**
 * Label padrão para campos de formulário
 * Uso: <IonLabel className={LABEL_CLASSES.field}>Nome</IonLabel>
 */
export const LABEL_CLASSES = {
  /** Label padrão de campo (11px, semibold) */
  field: 'text-[11px] font-semibold text-slate-900 dark:text-slate-100',

  /** Label pequeno para campos secundários (10px) */
  small: 'text-[10px] text-slate-400 dark:text-slate-500',

  /** Label de seção/título (sm = 14px) */
  section: 'text-sm font-semibold text-slate-100',

  /** Label de item em lista (13px) */
  item: 'text-[13px] font-bold text-slate-100',

  /** Label de descrição/subtítulo */
  description: 'text-xs text-slate-500 dark:text-slate-400',
}

// =====================================================
// INPUTS & SELECTS
// =====================================================

/**
 * Estilos inline para IonInput e IonSelect
 * Uso: <IonInput style={INPUT_STYLES.default} />
 */
export const INPUT_STYLES = {
  /** Input padrão (10.5px) */
  default: {
    fontSize: '10.5px',
  } as CSSProperties,

  /** Select padrão (11px com placeholders) */
  select: {
    fontSize: '11px',
    ['--placeholder-color']: '#94a3b8',
    ['--color']: '#e2e8f0',
  } as CSSProperties & Record<string, string>,

  /** Select pequeno para filtros */
  selectSmall: {
    fontSize: '11px',
    ['--placeholder-color']: '#94a3b8',
    ['--color']: '#94a3b8',
  } as CSSProperties & Record<string, string>,
}

/**
 * Estilos para IonItem contendo inputs (compacto)
 * Uso: <IonItem style={ITEM_STYLES.compact} />
 */
export const ITEM_STYLES = {
  /** Item compacto para formulários inline */
  compact: {
    ['--padding-start']: '0px',
    ['--inner-padding-end']: '0px',
    ['--min-height']: '26px',
    ['--background']: 'transparent',
  } as CSSProperties & Record<string, string>,

  /** Item padrão para formulários */
  default: {
    ['--padding-start']: '12px',
    ['--padding-end']: '12px',
    ['--min-height']: '44px',
  } as CSSProperties & Record<string, string>,
}

// =====================================================
// BOTÕES
// =====================================================

/**
 * Estilos de padding para botões
 * Uso: <IonButton style={BUTTON_STYLES.icon} />
 */
export const BUTTON_STYLES = {
  /** Botão apenas ícone (compacto) */
  icon: {
    ['--padding-start']: '6px',
    ['--padding-end']: '6px',
    ['--color']: '#94a3b8',
  } as CSSProperties & Record<string, string>,

  /** Botão de ação primária */
  primary: {
    ['--padding-start']: '14px',
    ['--padding-end']: '14px',
  } as CSSProperties & Record<string, string>,

  /** Botão compacto com texto */
  compact: {
    ['--padding-start']: '10px',
    ['--padding-end']: '10px',
  } as CSSProperties & Record<string, string>,
}

/**
 * Classes Tailwind para botões
 */
export const BUTTON_CLASSES = {
  /** Botão ícone pequeno */
  iconSmall: 'm-0 h-7',

  /** Botão de ação principal */
  primary: 'w-full',
}

// =====================================================
// CARDS & CONTAINERS
// =====================================================

/**
 * Classes para cards e containers
 */
export const CARD_CLASSES = {
  /** Card padrão */
  default: 'p-3 shadow-sm',

  /** Card de item em lista */
  listItem: 'mb-2 shadow-sm',

  /** Container de formulário */
  form: 'rounded-2xl bg-slate-900/60 p-4',

  /** Container de editor inline */
  editor: 'mt-2 bg-slate-950/50 rounded-xl p-4 space-y-3',
}

// =====================================================
// TEXTOS
// =====================================================

/**
 * Classes para textos diversos
 */
export const TEXT_CLASSES = {
  /** Contador/paginação (10px) */
  counter: 'text-[10px] font-medium text-slate-400',

  /** Badge/tag pequeno */
  badge: 'text-[10px] px-2 py-0.5 rounded-full font-semibold',

  /** Mensagem de erro */
  error: 'text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2',

  /** Mensagem de sucesso */
  success: 'text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2',

  /** Mensagem de aviso */
  warning: 'text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2',

  /** Texto de ajuda/hint */
  hint: 'text-xs text-slate-500 dark:text-slate-400 mt-1',
}

// =====================================================
// ACORDEÕES
// =====================================================

/**
 * Classes para acordeões (IonAccordion)
 */
export const ACCORDION_CLASSES = {
  /** Título do acordeão */
  header: 'text-sm font-semibold text-gray-800 dark:text-gray-200',

  /** Subtítulo do acordeão */
  subtitle: 'text-xs text-slate-500 dark:text-slate-400',
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Função helper para mesclar estilos
 */
export function mergeStyles(...styles: Array<CSSProperties | Record<string, string>>): CSSProperties & Record<string, string> {
  return Object.assign({}, ...styles) as CSSProperties & Record<string, string>
}

/**
 * Função helper para mesclar classes
 */
export function mergeClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ')
}
