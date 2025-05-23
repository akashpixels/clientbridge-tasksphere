
import React, { useState } from 'react';
import { BillingListPage, BillingCreatePage } from '@/components/billing';

const Billing: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <BillingCreatePage onClose={() => setIsCreating(false)} />;
  }

  return <BillingListPage onCreateNew={() => setIsCreating(true)} />;
};

export default Billing;
