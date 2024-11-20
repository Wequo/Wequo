"use client";

import React from 'react';
import QuoteForm from '@/components/QuoteForm';
import { useSearchParams, usePathname } from 'next/navigation';

const Page = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const formId = pathname.split('/')[1]; 

  const isDialog = searchParams.get('isDialog') === 'true';
  const showPrices = searchParams.get('showPrices') === 'true';

  if (!formId) {
    return <p>Loading...</p>;
  }


  return (
    <div>
      <QuoteForm formId={formId} isDialog={isDialog} showPrices={showPrices} />
    </div>
  );
};

export default Page;
