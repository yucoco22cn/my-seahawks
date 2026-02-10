
import React, { useState, useEffect } from 'react';

interface PaymentModalProps {
  item: { name: string, price: string, type: 'PRO' | 'COINS', amount?: number };
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ item, onSuccess, onCancel }) => {
  const [step, setStep] = useState<'DETAILS' | 'REDIRECTING'>('DETAILS');

  const handleCheckoutRedirect = () => {
    setStep('REDIRECTING');

    /**
     * PRODUCTION STRIPE CHECKOUT FLOW (The easy way):
     * 
     * 1. Go to Stripe Dashboard -> Products.
     * 2. Create your Pro Pass and Coin packs.
     * 3. Create a "Payment Link" for each.
     * 4. In the Payment Link settings, set the "Success URL" to:
     *    https://yourusername.github.io/my-seahawks/?payment=success&type=${item.type}&amount=${item.amount || 0}
     * 
     * Instead of the window.location below, you'd use your specific link:
     */
    
    const STRIPE_LINKS: Record<string, string> = {
      'PRO': 'https://buy.stripe.com/test_placeholder_pro_pass',
      'COINS_500': 'https://buy.stripe.com/test_placeholder_coins_500',
      // ... more links
    };

    const targetLink = item.type === 'PRO' ? STRIPE_LINKS['PRO'] : STRIPE_LINKS[`COINS_${item.amount}`];

    // SIMULATION: If we were really going to Stripe, we'd do:
    // if (targetLink) window.location.href = targetLink;
    
    // For this demo, let's just simulate the redirect return after a delay
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[250] flex items-center justify-center p-6">
      <div className="bg-[#111] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden p-8 text-center">
        {step === 'DETAILS' ? (
          <>
            <div className="mb-8">
              <div className="w-20 h-20 bg-seahawks-green/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 border border-seahawks-green/20">
                {item.type === 'PRO' ? '👑' : '🪙'}
              </div>
              <h2 className="text-2xl font-black text-white italic mb-1 uppercase tracking-tighter">{item.name}</h2>
              <p className="text-seahawks-green font-black text-xl">{item.price}</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleCheckoutRedirect}
                className="w-full py-5 bg-seahawks-green hover:scale-105 text-black font-black rounded-2xl shadow-xl shadow-seahawks-green/10 transition flex items-center justify-center gap-3"
              >
                <span>🚀</span> PROCEED TO CHECKOUT
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/40 font-black rounded-2xl transition text-sm"
              >
                CANCEL
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-30 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
            </div>
          </>
        ) : (
          <div className="py-12">
            <div className="w-16 h-16 border-4 border-seahawks-green border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <h3 className="text-xl font-black text-white italic mb-2">SECURE REDIRECT</h3>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Opening Stripe Checkout...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
