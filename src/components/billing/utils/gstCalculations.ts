
import { LineItem, GSTDetails, AgencyGSTDetails } from "../types";

export const calculateGST = (
  items: LineItem[],
  placeOfSupply: string,
  agencyState: string
): GSTDetails => {
  const isIntraState = placeOfSupply === agencyState;
  const isInternational = placeOfSupply === "International";
  
  let totalTaxableAmount = 0;
  let totalGSTAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  items.forEach(item => {
    const itemTaxableAmount = item.quantity * item.rate;
    totalTaxableAmount += itemTaxableAmount;

    if (!isInternational) {
      const gstAmount = (itemTaxableAmount * item.gst_rate) / 100;
      totalGSTAmount += gstAmount;

      if (isIntraState) {
        // CGST + SGST (split equally)
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;
        totalCGST += cgst;
        totalSGST += sgst;
      } else {
        // IGST (full amount)
        totalIGST += gstAmount;
      }
    }
  });

  return {
    cgst: Math.round(totalCGST * 100) / 100,
    sgst: Math.round(totalSGST * 100) / 100,
    igst: Math.round(totalIGST * 100) / 100,
    total_gst: Math.round(totalGSTAmount * 100) / 100,
    taxable_amount: Math.round(totalTaxableAmount * 100) / 100,
    total_amount: Math.round((totalTaxableAmount + totalGSTAmount) * 100) / 100,
  };
};

export const calculateTDS = (amount: number, tdsRate: number): number => {
  return Math.round((amount * tdsRate / 100) * 100) / 100;
};

export const calculateLineItemTotal = (item: Partial<LineItem>): LineItem => {
  const quantity = item.quantity || 0;
  const rate = item.rate || 0;
  const gstRate = item.gst_rate || 18;
  
  const amount = quantity * rate;
  const gstAmount = (amount * gstRate) / 100;
  const totalAmount = amount + gstAmount;

  return {
    id: item.id || crypto.randomUUID(),
    description: item.description || '',
    quantity,
    rate,
    amount: Math.round(amount * 100) / 100,
    gst_rate: gstRate,
    gst_amount: Math.round(gstAmount * 100) / 100,
    total_amount: Math.round(totalAmount * 100) / 100,
    sac_code: item.sac_code || '998314', // Add the missing sac_code property with default value
  };
};

export const detectStateFromAddress = (address: string, indianStates: string[]): string => {
  const addressLower = address.toLowerCase();
  
  for (const state of indianStates) {
    if (addressLower.includes(state.toLowerCase())) {
      return state;
    }
  }
  
  // Check for international keywords
  const internationalKeywords = ['usa', 'uk', 'singapore', 'canada', 'australia', 'uae', 'dubai'];
  for (const keyword of internationalKeywords) {
    if (addressLower.includes(keyword)) {
      return 'International';
    }
  }
  
  return '';
};
