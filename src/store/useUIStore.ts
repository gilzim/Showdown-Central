import { create } from 'zustand'

type ModalType = 'alert' | 'confirm'
type ModalVariant = 'info' | 'danger' | 'success' | 'warning'

interface ModalState {
  isOpen: boolean
  type: ModalType
  variant: ModalVariant
  iconName?: string
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  resolve: (value: boolean) => void
}

interface UIState {
  modal: ModalState
  showAlert: (title: string, message: string, confirmLabel?: string, variant?: ModalVariant, iconName?: string) => Promise<boolean>
  showConfirm: (title: string, message: string, confirmLabel?: string, cancelLabel?: string, variant?: ModalVariant, iconName?: string) => Promise<boolean>
  closeModal: (value: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  modal: {
    isOpen: false,
    type: 'alert',
    variant: 'info',
    title: '',
    message: '',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    resolve: () => {},
  },

  showAlert: (title, message, confirmLabel = 'OK', variant = 'info', iconName) => {
    return new Promise((resolve) => {
      set({
        modal: {
          isOpen: true,
          type: 'alert',
          variant,
          iconName,
          title,
          message,
          confirmLabel,
          cancelLabel: '',
          resolve,
        },
      })
    })
  },

  showConfirm: (title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'info', iconName) => {
    return new Promise((resolve) => {
      set({
        modal: {
          isOpen: true,
          type: 'confirm',
          variant,
          iconName,
          title,
          message,
          confirmLabel,
          cancelLabel,
          resolve,
        },
      })
    })
  },

  closeModal: (value) => {
    const { resolve } = get().modal
    set((state) => ({
      modal: { ...state.modal, isOpen: false },
    }))
    resolve(value)
  },
}))
