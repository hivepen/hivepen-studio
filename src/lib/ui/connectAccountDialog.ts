export const CONNECT_ACCOUNT_DIALOG_EVENT = 'hivepen:connect-account-dialog'

export const openConnectAccountDialog = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CONNECT_ACCOUNT_DIALOG_EVENT))
}
