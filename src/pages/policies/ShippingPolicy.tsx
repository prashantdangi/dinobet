import React from 'react';

const ShippingPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shipping Policy</h1>
      <div className="prose max-w-none">
        <p>This is a digital product, and no physical shipping is involved.</p>
        {/* Add more shipping policy content here */}
      </div>
    </div>
  );
};

export default ShippingPolicy; 