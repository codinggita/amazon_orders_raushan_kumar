import api from './api';

// Categories Endpoints
export const fetchCategories = () => api.get('/categories').then((res) => res.data);
export const createCategory = (data) => api.post('/categories', data).then((res) => res.data);
export const updateCategory = (id, data) => api.patch(`/categories/${id}`, data).then((res) => res.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((res) => res.data);

// Products Endpoints
export const fetchProducts = (params) => api.get('/products', { params }).then((res) => res.data);
export const fetchProductById = (id) => api.get(`/products/${id}`).then((res) => res.data);
export const createProduct = (data) => api.post('/products', data).then((res) => res.data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data).then((res) => res.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((res) => res.data);

// Orders Endpoints
export const fetchOrders = () => api.get('/orders').then((res) => res.data);
export const fetchOrderById = (id) => api.get(`/orders/${id}`).then((res) => res.data);
export const createOrder = (data) => api.post('/orders', data).then((res) => res.data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status }).then((res) => res.data);

// Customers Endpoints
export const fetchCustomers = () => api.get('/customers').then((res) => res.data);

// Sellers Endpoints
export const fetchSellers = () => api.get('/sellers').then((res) => res.data);

// Inventory Endpoints
export const fetchInventory = () => api.get('/inventory').then((res) => res.data);
export const updateInventory = (id, data) => api.patch(`/inventory/${id}`, data).then((res) => res.data);

// Search Endpoints
export const searchCatalog = (params) => api.get('/search/products', { params }).then((res) => res.data);
export const fetchAutocomplete = (q) => api.get('/search/autocomplete', { params: { q } }).then((res) => res.data);
export const fetchSearchAnalytics = () => api.get('/search/analytics').then((res) => res.data);

// System Health
export const getSystemHealth = () => api.get('/health').then((res) => res.data);
