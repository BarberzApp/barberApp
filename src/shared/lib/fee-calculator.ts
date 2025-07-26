// Fee calculation utilities
export const PLATFORM_FEE_CENTS = 338 // $3.38 in cents
export const BOCM_SHARE_PERCENTAGE = 0.60 // 60%
export const BARBER_SHARE_PERCENTAGE = 0.40 // 40%

export interface FeeBreakdown {
  platformFee: number // Total platform fee in cents
  bocmShare: number // Platform's share in cents (60%)
  barberShare: number // Barber's share in cents (40%)
}

export function calculateFeeBreakdown(): FeeBreakdown {
  const bocmShare = Math.round(PLATFORM_FEE_CENTS * BOCM_SHARE_PERCENTAGE)
  const barberShare = PLATFORM_FEE_CENTS - bocmShare

  return {
    platformFee: PLATFORM_FEE_CENTS,
    bocmShare,
    barberShare
  }
}

export function calculateBarberPayout(servicePriceCents: number, paymentType: 'fee' | 'full'): number {
  const { barberShare } = calculateFeeBreakdown()
  
  if (paymentType === 'fee') {
    // For fee-only payments, barber only gets their share of the fee
    return barberShare
  } else {
    // For full payments, barber gets service price + their share of the fee
    return servicePriceCents + barberShare
  }
}

export function calculatePlatformFee(paymentType: 'fee' | 'full'): number {
  const { bocmShare } = calculateFeeBreakdown()
  
  if (paymentType === 'fee') {
    // For fee-only payments, platform gets their share of the fee
    return bocmShare
  } else {
    // For full payments, platform gets their share of the fee
    return bocmShare
  }
} 