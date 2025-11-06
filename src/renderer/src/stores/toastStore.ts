import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'warning'

interface ToastState {
  show: boolean
  msg: string
  type: ToastType
  title: string
  showToast: (msg: string, type?: ToastType, title?: string) => void
  hideToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  show: false,
  msg: '',
  type: 'success',
  title: '',
  showToast: (msg, type = 'success', title = '') => set({ show: true, msg, type, title }),
  hideToast: () => set({ show: false })
}))
