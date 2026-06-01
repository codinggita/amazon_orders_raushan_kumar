import mongoose from 'mongoose';

// 1. IMMUTABLE SNAPSHOT SUBSCHEMAS (To lock purchase-time states)
const customerSnapshotSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
}, { _id: false });

const pricingSnapshotSchema = new mongoose.Schema({
  basePrice: { type: Number, required: true },
  discountType: { type: String, enum: ['PERCENTAGE', 'FLAT', 'NONE'], default: 'NONE' },
  discountValue: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  finalPricePerUnit: { type: Number, required: true },
}, { _id: false });

const productSnapshotSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  categoryPath: { type: [String], required: true },
  brandName: { type: String, required: true },
}, { _id: false });

const orderProductSchema = new mongoose.Schema({
  productSnapshot: { type: productSnapshotSchema, required: true },
  pricingSnapshot: { type: pricingSnapshotSchema, required: true },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1.'] },
}, { _id: false });

const paymentSnapshotSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  method: { 
    type: String, 
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'NET_BANKING', 'COD'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'REFUNDED'], 
    default: 'PENDING' 
  },
  amount: { type: Number, required: true },
  transactionId: { type: String },
  paidAt: { type: Date },
}, { _id: false });

const shippingSnapshotSchema = new mongoose.Schema({
  carrier: { type: String },
  trackingNumber: { type: String },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  estimatedDelivery: { type: Date },
}, { _id: false });

const auditTrailSchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, default: 'SYSTEM' }, // e.g., 'SYSTEM', 'SUPPORT_AGENT_ID'
  note: { type: String },
}, { _id: false });

// 2. ORDER CORE SCHEMA
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerSnapshot: {
      type: customerSnapshotSchema,
      required: true,
    },
    products: {
      type: [orderProductSchema],
      required: [true, 'Orders must contain at least one product.'],
      validate: [
        (arr) => arr.length > 0, 
        'Order product list cannot be empty.'
      ],
    },
    paymentSnapshot: {
      type: paymentSnapshotSchema,
      required: true,
    },
    shippingSnapshot: {
      type: shippingSnapshotSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    fulfillment: {
      status: {
        type: String,
        enum: ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED'],
        default: 'UNFULFILLED',
      },
      dispatchedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    // financial metrics snapshot for direct querying without scanning subdocs
    analyticsSnapshot: {
      subtotalAmount: { type: Number, required: true },
      discountAmount: { type: Number, required: true, default: 0 },
      taxAmount: { type: Number, required: true, default: 0 },
      shippingAmount: { type: Number, required: true, default: 0 },
      totalRevenue: { type: Number, required: true, index: true },
    },
    auditTrail: {
      type: [auditTrailSchema],
      default: [],
    },
    system: {
      isDeleted: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
      },
      deletedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true, // Generates orderDate automatically as createdAt
    versionKey: false,
  }
);

// FSM: VALID TRANSITIONS DEFINITION
const VALID_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

// Lifecycle hook to parse and save the original document state on retrieve
orderSchema.post('init', function (doc) {
  doc._originalStatus = doc.status;
});

// 3. FINITE STATE MACHINE PRE-SAVE GUARD
orderSchema.pre('save', function (next) {
  const order = this;

  // A. ENSURE FSM COMPLIANCE
  if (order.isModified('status') && order._originalStatus) {
    const allowedTransitions = VALID_STATUS_TRANSITIONS[order._originalStatus] || [];
    
    if (!allowedTransitions.includes(order.status)) {
      return next(
        new Error(`CRITICAL: Illegal order state transition blocked. Cannot transition order "${order.orderId}" from "${order._originalStatus}" to "${order.status}".`)
      );
    }
  }

  // B. AUTO-APPEND TO SYSTEM AUDIT TRAILS
  if (order.isModified('status') || order.isNew) {
    order.auditTrail.push({
      status: order.status,
      changedAt: new Date(),
      note: order.isNew 
        ? 'Order initialized.' 
        : `Status transitioned from ${order._originalStatus} to ${order.status}.`
    });
  }

  // C. DYNAMIC FULFILLMENT SYNC
  if (order.isModified('status')) {
    if (order.status === 'SHIPPED') {
      order.fulfillment.status = 'PARTIALLY_FULFILLED';
      order.fulfillment.dispatchedAt = new Date();
    } else if (order.status === 'DELIVERED') {
      order.fulfillment.status = 'FULFILLED';
      order.fulfillment.deliveredAt = new Date();
    } else if (order.status === 'CANCELLED') {
      order.fulfillment.status = 'UNFULFILLED';
    }
  }

  next();
});

// 4. CRITICAL ANALYTICS INDEXES
// High speed lookup for buyer transaction history and time ranges
orderSchema.index({ 'customerSnapshot.userId': 1, createdAt: -1 });

// High speed lookup for finance dashboards: Filtered by status + order time + total revenue yields
orderSchema.index({ status: 1, createdAt: -1, 'analyticsSnapshot.totalRevenue': 1 });

// High speed lookup for geographic reports: Filtered by destination country + revenue sizing
orderSchema.index({ 'shippingSnapshot.address.country': 1, 'analyticsSnapshot.totalRevenue': 1 });

// query middleware to hide soft-deleted orders
orderSchema.pre(/^find/, function (next) {
  this.where({ 'system.isDeleted': false });
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
