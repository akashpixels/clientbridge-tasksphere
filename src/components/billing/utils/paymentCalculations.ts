
export interface PaymentCalculation {
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
}

export const calculatePaymentAmount = (
  totalAmount: number,
  paymentPercentage: number
): PaymentCalculation => {
  const baseAmount = (totalAmount * paymentPercentage) / 100;
  
  // Apply 5% discount only for full payment (100%)
  const discountPercentage = paymentPercentage === 100 ? 5 : 0;
  const discountAmount = (baseAmount * discountPercentage) / 100;
  const finalAmount = baseAmount - discountAmount;

  return {
    baseAmount,
    discountAmount,
    finalAmount,
    discountPercentage
  };
};

export const calculateRemainingAmount = (
  originalAmount: number,
  paidAmount: number
): number => {
  return Math.max(0, originalAmount - paidAmount);
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};
