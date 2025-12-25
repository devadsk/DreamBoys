const axios = require('axios');
const admin = require('firebase-admin');

const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external';

/**
 * Get Shiprocket Authentication Token
 */
async function getShiprocketToken() {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        console.warn('Shiprocket credentials not set. Using mock token for test mode.');
        return 'MOCK_TOKEN';
    }

    try {
        const response = await axios.post(`${SHIPROCKET_API_URL}/auth/login`, {
            email,
            password
        });
        return response.data.token;
    } catch (error) {
        console.error('Shiprocket Auth Error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Shiprocket');
    }
}

/**
 * Map Shiprocket status to internal order status
 */
function mapShiprocketStatus(status) {
    const s = status.toUpperCase();

    if (['NEW', 'INVOICED'].includes(s)) return 'confirmed';
    if (['READY TO SHIP', 'PACKED'].includes(s)) return 'packed';
    if (['PICKED UP', 'IN TRANSIT', 'SHIPPED'].includes(s)) return 'shipped';
    if (['OUT FOR DELIVERY'].includes(s)) return 'out_for_delivery';
    if (['DELIVERED'].includes(s)) return 'delivered';
    if (['CANCELED', 'CANCELLED'].includes(s)) return 'cancelled';
    if (s.includes('RTO')) return 'returned';

    return null; // No change for unknown statuses
}

/**
 * Create Shiprocket Order
 */
async function createShiprocketOrder(orderData, orderId) {
    const token = await getShiprocketToken();

    // In test mode, if no credentials, return a mock response
    if (token === 'MOCK_TOKEN') {
        return {
            order_id: `SR-${Date.now()}`,
            shipment_id: `SHP-${Date.now()}`,
            status: 'NEW',
            courier_name: 'Ecom Express (Mock)',
            tracking_id: 'TRACK123456789',
            tracking_url: 'https://shiprocket.co/tracking/TRACK123456789'
        };
    }

    const snapshot = orderData.delivery?.snapshot || orderData.deliveryInfo || orderData.shippingAddress || {};
    const items = orderData.items || [];

    if (items.length === 0) {
        throw new Error('Order has no items for shipment');
    }

    const payload = {
        order_id: orderData.orderNumber,
        order_date: new Date(orderData.createdAt).toISOString().slice(0, 10),
        pickup_location: "Primary",
        billing_customer_name: snapshot.fullName || 'Customer',
        billing_last_name: "",
        billing_address: snapshot.street || '',
        billing_city: snapshot.city || '',
        billing_pincode: snapshot.zipCode || '000000',
        billing_state: snapshot.state || '',
        billing_country: "India",
        billing_email: snapshot.email || orderData.email || '',
        billing_phone: snapshot.phone || '0000000000',
        shipping_is_billing: true,
        order_items: items.map((item, index) => ({
            name: item.name || 'Product',
            sku: item.sku || `${orderData.orderNumber}-${index + 1}`.toUpperCase(),
            units: Number(item.quantity) || 1,
            selling_price: Number(item.price) || 0,
            discount: 0,
            tax: 0,
            hsn: ""
        })),
        payment_method: orderData.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        shipping_charges: Number(orderData.delivery?.snapshot?.charge || orderData.deliveryInfo?.charge || 0),
        giftwrap_charges: 0,
        transaction_parametres: 0,
        total_discount: 0,
        sub_total: Number(orderData.subtotal) || Number(orderData.total),
        length: 10,
        width: 10,
        height: 10,
        weight: 0.5
    };

    try {
        const response = await axios.post(`${SHIPROCKET_API_URL}/orders/create/adhoc`, payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create Shiprocket shipment');
    }
}

module.exports = {
    createShiprocketOrder,
    mapShiprocketStatus,
    getShiprocketToken
};
