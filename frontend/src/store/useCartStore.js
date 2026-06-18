import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cartItems') || '[]'),

  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existingIndex = items.findIndex(item => item.product.identity.productId === product.identity.productId);
    
    let updatedItems;
    if (existingIndex > -1) {
      updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
    } else {
      updatedItems = [...items, { product, quantity }];
    }

    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  removeItem: (productId) => {
    const updatedItems = get().items.filter(item => item.product.identity.productId !== productId);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const updatedItems = get().items.map(item => 
      item.product.identity.productId === productId 
        ? { ...item, quantity }
        : item
    );
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    set({ items: updatedItems });
  },

  clearCart: () => {
    localStorage.removeItem('cartItems');
    set({ items: [] });
  },

  getTotals: () => {
    const items = get().items;
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let shipping = 0;
    let itemsCount = 0;

    items.forEach(item => {
      const qty = item.quantity;
      const basePrice = item.product.pricing.basePrice;
      const unitDiscount = item.product.pricing.discount;
      
      let itemDiscount = 0;
      if (unitDiscount && unitDiscount.value > 0) {
        if (unitDiscount.type === 'PERCENTAGE') {
          itemDiscount = basePrice * (unitDiscount.value / 100);
        } else if (unitDiscount.type === 'FLAT') {
          itemDiscount = unitDiscount.value;
        }
      }

      const discountedPrice = Math.max(0, basePrice - itemDiscount);
      const itemTax = discountedPrice * ((item.product.pricing.tax?.rate || 0) / 100);
      const itemShipping = item.product.pricing.shippingCost || 0;

      subtotal += basePrice * qty;
      discount += itemDiscount * qty;
      tax += itemTax * qty;
      shipping += itemShipping * qty;
      itemsCount += qty;
    });

    const total = parseFloat(Math.max(0, subtotal - discount + tax + shipping).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total,
      itemsCount
    };
  }
}));
