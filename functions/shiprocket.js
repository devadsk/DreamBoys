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
        throw new Error('Shiprocket credentials (SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD) are not configured in environment variables.');
    }

    try {
        const response = await axios.post(`${SHIPROCKET_API_URL}/auth/login`, {
            email,
            password
        });

        if (!response.data.token) {
            throw new Error('Authentication successful but no token received from Shiprocket.');
        }

        return response.data.token;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('Shiprocket Auth Error:', errorMsg);
        throw new Error(`Failed to authenticate with Shiprocket: ${errorMsg}`);
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

    const snapshot = orderData.delivery?.snapshot || orderData.deliveryInfo || orderData.shippingAddress || {};
    const items = orderData.items || [];

    if (items.length === 0) {
        throw new Error('Order has no items for shipment');
    }

    const orderDate = orderData.createdAt
        ? (typeof orderData.createdAt.toDate === 'function'
            ? orderData.createdAt.toDate()
            : new Date(orderData.createdAt))
        : new Date();

    const payload = {
        order_id: orderData.orderNumber,
        order_date: orderDate.toISOString().slice(0, 10),
        pickup_location: "Home",
        billing_customer_name: snapshot.fullName || 'Customer',
        billing_last_name: "",
        billing_address: snapshot.street || '',
        billing_city: snapshot.city || '',
        billing_pincode: snapshot.zipCode || '000000',
        billing_state: snapshot.state || '',
        billing_country: "India",
        billing_email: snapshot.email || orderData.email || '',
        billing_phone: (snapshot.phone || '0000000000').replace(/\D/g, '').slice(-10),
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
        breadth: 10,
        height: 10,
        weight: 0.5
    };

    try {
        const response = await axios.post(`${SHIPROCKET_API_URL}/orders/create/adhoc`, payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const srData = response.data;

        // Step 2: Assign AWB automatically
        if (srData.shipment_id) {
            try {
                const awbResponse = await axios.post(`${SHIPROCKET_API_URL}/courier/assign/awb`, {
                    shipment_id: srData.shipment_id
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (awbResponse.data && awbResponse.data.response && awbResponse.data.response.data) {
                    const awbData = awbResponse.data.response.data;
                    srData.awb_code = awbData.awb_code;
                    srData.courier_name = awbData.courier_name;
                    srData.tracking_id = awbData.awb_code;
                    // Some responses include a tracking_url, otherwise we'll build it in functions
                }
            } catch (awbError) {
                console.error('AWB Assignment Error:', awbError.response?.data || awbError.message);
                // We still want to return the order/shipment info even if AWB assignment fails
                // The admin can retry AWB assignment in the Shiprocket dashboard or our Retry button
            }
        }

        return srData;
    } catch (error) {
        const srError = error.response?.data;
        console.error('Shiprocket Create Order Error:', srError || error.message);

        let errorMessage = srError?.message || 'Failed to create Shiprocket shipment';

        // If Shiprocket provides specific field errors, include them
        if (srError?.errors) {
            const details = Object.entries(srError.errors)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                .join('; ');
            errorMessage += ` (${details})`;
        }

        throw new Error(errorMessage);
    }
}

module.exports = {
    createShiprocketOrder,
    mapShiprocketStatus,
    getShiprocketToken
};
