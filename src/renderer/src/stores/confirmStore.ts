import { create } from 'zustand'

type ConfirmType = 'success' | 'error' | 'warning'

interface ConfirmState {
  show: boolean
  type: ConfirmType
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: (() => void) | null
  showConfirm: (
    message: string,
    onConfirm: () => void,
    options?: {
      type?: ConfirmType
      title?: string
      confirmText?: string
      cancelText?: string
    }
  ) => void
  hideConfirm: () => void
  handleConfirm: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  show: false,
  type: 'warning',
  title: '확인',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: null,
  showConfirm: (message, onConfirm, options = {}) =>
    set({
      show: true,
      message,
      onConfirm,
      type: options.type || 'warning',
      title: options.title || '확인',
      confirmText: options.confirmText || '확인',
      cancelText: options.cancelText || '취소'
    }),
  hideConfirm: () => set({ show: false, onConfirm: null }),
  handleConfirm: () => {
    const { onConfirm, hideConfirm } = get()
    if (onConfirm) {
      onConfirm()
    }
    hideConfirm()
  }
}))
