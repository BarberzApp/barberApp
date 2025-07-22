"use client"

import { SMSPermissionPopup, useSMSPermissionPopup } from './sms-permission-popup'

export function SMSPopupWrapper() {
  const { shouldShowPopup, enableSMS, dismissPopup } = useSMSPermissionPopup()

  return (
    <SMSPermissionPopup
      isOpen={shouldShowPopup}
      onClose={dismissPopup}
      onEnableSMS={enableSMS}
    />
  )
} 