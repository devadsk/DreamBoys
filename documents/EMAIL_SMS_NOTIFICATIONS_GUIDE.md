# Email & SMS Notifications Implementation Guide

## 🎯 Overview

Professional e-commerce platforms send automated notifications for:
- Order confirmation
- Order status updates (Processing, Shipped, Delivered)
- Payment confirmation
- Shipping updates with tracking
- Delivery confirmation

## 📧 Email Notifications

### Option 1: Firebase Extensions (Easiest) ⭐ **RECOMMENDED**

#### **Trigger Email Extension**
Firebase provides a pre-built email extension that integrates with your Firestore.

**Setup:**
```bash
firebase ext:install firebase/firestore-send-email
```

**Configuration:**
1. **Email Provider**: Use SendGrid, Mailgun, or SMTP
2. **Trigger Collection**: `mail` (emails to send)
3. **Template Support**: HTML email templates

**How It Works:**
```javascript
// When order is created, add email document
await addDoc(collection(db, 'mail'), {
  to: customerEmail,
  template: {
    name: 'orderConfirmation',
    data: {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items,
      total: order.total,
      trackingUrl: 'https://yoursite.com/track/...'
    }
  }
});
```

**Benefits:**
- ✅ No backend code needed
- ✅ Automatic retry on failure
- ✅ Template support
- ✅ Free tier available

---

### Option 2: SendGrid (Popular Choice)

**Setup:**
```bash
npm install @sendgrid/mail
```

**Implementation in Cloud Functions:**
```javascript
// functions/index.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOrderConfirmation = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    const msg = {
      to: order.email,
      from: 'orders@dreamboys.com', // Your verified sender
      subject: `Order Confirmation - #${order.orderNumber}`,
      html: generateOrderEmailHTML(order)
    };
    
    try {
      await sgMail.send(msg);
      console.log('Order confirmation email sent');
    } catch (error) {
      console.error('Email error:', error);
    }
  });

function generateOrderEmailHTML(order) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #2563eb; color: white; padding: 20px; }
        .content { padding: 20px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${order.shippingAddress.fullName},</p>
          <p>Thank you for your order!</p>
          <h2>Order #${order.orderNumber}</h2>
          <p><strong>Total:</strong> ₹${order.total}</p>
          <h3>Items:</h3>
          <ul>
            ${order.items.map(item => `
              <li>${item.name} - ₹${item.price} x ${item.quantity}</li>
            `).join('')}
          </ul>
          <p>We'll send you another email when your order ships.</p>
        </div>
        <div class="footer">
          <p>DreamBoys Fashion</p>
          <p>Track your order: <a href="https://dreamboys.com/orders">View Orders</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

**Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month (50,000 emails)

---

### Option 3: Nodemailer (Free SMTP)

**Setup:**
```bash
npm install nodemailer
```

**Implementation:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or any SMTP service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendOrderEmail = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    const mailOptions = {
      from: 'DreamBoys <noreply@dreamboys.com>',
      to: order.email,
      subject: `Order Confirmation - #${order.orderNumber}`,
      html: generateOrderEmailHTML(order)
    };
    
    await transporter.sendMail(mailOptions);
  });
```

**Pricing:**
- Free with Gmail (limited)
- Free with custom SMTP server

---

## 📱 SMS Notifications

### Option 1: Twilio (Most Popular) ⭐ **RECOMMENDED**

**Setup:**
```bash
npm install twilio
```

**Implementation:**
```javascript
// functions/index.js
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendOrderSMS = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    const message = `
Hi ${order.shippingAddress.fullName}!

Your order #${order.orderNumber} has been confirmed.
Total: ₹${order.total}

Track your order: https://dreamboys.com/orders

- DreamBoys Fashion
    `.trim();
    
    try {
      await client.messages.create({
        body: message,
        from: '+1234567890', // Your Twilio number
        to: order.shippingAddress.phone
      });
      console.log('SMS sent successfully');
    } catch (error) {
      console.error('SMS error:', error);
    }
  });
```

**Pricing:**
- India: ₹0.50 - ₹1.50 per SMS
- Pay as you go
- Free trial credits available

---

### Option 2: MSG91 (India-Specific) 🇮🇳

**Better for Indian customers:**
```bash
npm install msg91-sms
```

**Implementation:**
```javascript
const MSG91 = require('msg91-sms');

const msg91 = new MSG91(process.env.MSG91_AUTH_KEY);

exports.sendOrderSMS = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    await msg91.send({
      sender: 'DRMBYS', // 6-char sender ID
      route: '4', // Transactional route
      country: '91',
      sms: [
        {
          message: `Order #${order.orderNumber} confirmed! Total: ₹${order.total}. Track: https://dreamboys.com/orders`,
          to: [order.shippingAddress.phone]
        }
      ]
    });
  });
```

**Pricing:**
- ₹0.15 - ₹0.25 per SMS (cheaper than Twilio for India)
- DND compliant
- OTP support

---

### Option 3: Firebase Cloud Messaging (FCM)

**For in-app notifications:**
```javascript
const admin = require('firebase-admin');

exports.sendOrderNotification = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    // Get user's FCM token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(order.userId)
      .get();
    
    const fcmToken = userDoc.data().fcmToken;
    
    if (fcmToken) {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: 'Order Confirmed!',
          body: `Order #${order.orderNumber} - ₹${order.total}`
        },
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber
        }
      });
    }
  });
```

**Pricing:**
- ✅ Completely FREE
- Works only for app notifications (not SMS)

---

## 🔔 Complete Notification System

### Recommended Architecture:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

admin.initializeApp();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const smsClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 1. Order Created - Send Confirmation
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    // Send Email
    await sendEmail({
      to: order.email,
      subject: `Order Confirmation - #${order.orderNumber}`,
      template: 'orderConfirmation',
      data: order
    });
    
    // Send SMS
    await sendSMS({
      to: order.shippingAddress.phone,
      message: `Order #${order.orderNumber} confirmed! Total: ₹${order.total}`
    });
  });

// 2. Order Status Updated - Send Update
exports.onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only send if status changed
    if (before.status !== after.status) {
      const statusMessages = {
        processing: 'Your order is being processed',
        shipped: 'Your order has been shipped!',
        delivered: 'Your order has been delivered'
      };
      
      // Send Email
      await sendEmail({
        to: after.email,
        subject: `Order Update - #${after.orderNumber}`,
        template: 'orderStatusUpdate',
        data: {
          ...after,
          statusMessage: statusMessages[after.status]
        }
      });
      
      // Send SMS
      await sendSMS({
        to: after.shippingAddress.phone,
        message: `Order #${after.orderNumber}: ${statusMessages[after.status]}`
      });
    }
  });

// Helper Functions
async function sendEmail({ to, subject, template, data }) {
  try {
    await sgMail.send({
      to,
      from: 'orders@dreamboys.com',
      subject,
      html: generateEmailTemplate(template, data)
    });
    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Email error:', error);
  }
}

async function sendSMS({ to, message }) {
  try {
    await smsClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to
    });
    console.log('SMS sent to:', to);
  } catch (error) {
    console.error('SMS error:', error);
  }
}

function generateEmailTemplate(template, data) {
  // Load HTML templates
  const templates = {
    orderConfirmation: require('./templates/orderConfirmation'),
    orderStatusUpdate: require('./templates/orderStatusUpdate'),
    // ... more templates
  };
  
  return templates[template](data);
}
```

---

## 💰 Cost Comparison

### Email Services:
| Service | Free Tier | Paid Tier | Best For |
|---------|-----------|-----------|----------|
| SendGrid | 100/day | $19.95/month (50k) | High volume |
| Mailgun | 5,000/month | $35/month (50k) | Developers |
| Gmail SMTP | Limited | Free | Small scale |
| Firebase Extension | Based on provider | Based on provider | Easy setup |

### SMS Services:
| Service | Cost per SMS (India) | Best For |
|---------|---------------------|----------|
| Twilio | ₹0.50 - ₹1.50 | Global reach |
| MSG91 | ₹0.15 - ₹0.25 | India-focused |
| AWS SNS | ₹0.50 - ₹1.00 | AWS users |

---

## 📋 Implementation Steps

### Phase 1: Email Notifications (Week 1)
1. Choose email provider (SendGrid recommended)
2. Set up account and get API key
3. Create email templates
4. Implement Cloud Function for order creation
5. Test with test orders

### Phase 2: SMS Notifications (Week 2)
1. Choose SMS provider (MSG91 for India)
2. Set up account and get credentials
3. Implement Cloud Function for SMS
4. Test with test phone numbers

### Phase 3: Status Updates (Week 3)
1. Add onUpdate trigger for order status changes
2. Create status-specific templates
3. Test all status transitions

### Phase 4: Advanced Features (Week 4)
1. Add tracking links
2. Implement email open tracking
3. Add unsubscribe functionality
4. Set up analytics

---

## 🎨 Email Template Example

```html
<!-- templates/orderConfirmation.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .content {
      padding: 30px 20px;
    }
    .order-summary {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .total {
      font-size: 1.5rem;
      font-weight: bold;
      color: #2563eb;
      margin-top: 20px;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Order Confirmed!</h1>
      <p>Thank you for shopping with DreamBoys</p>
    </div>
    
    <div class="content">
      <p>Hi {{customerName}},</p>
      <p>Your order has been confirmed and will be shipped soon.</p>
      
      <div class="order-summary">
        <h2>Order #{{orderNumber}}</h2>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        
        <h3>Items:</h3>
        {{#each items}}
        <div class="item">
          <span>{{name}} ({{size}}, {{color}}) x {{quantity}}</span>
          <span>₹{{price}}</span>
        </div>
        {{/each}}
        
        <div class="total">
          Total: ₹{{total}}
        </div>
      </div>
      
      <h3>Shipping Address:</h3>
      <p>
        {{shippingAddress.fullName}}<br>
        {{shippingAddress.street}}<br>
        {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}
      </p>
      
      <a href="{{trackingUrl}}" class="button">Track Your Order</a>
    </div>
    
    <div class="footer">
      <p>DreamBoys Fashion</p>
      <p>Questions? Contact us at support@dreamboys.com</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
```

---

## ✅ Recommended Setup for DreamBoys

### For Email:
**SendGrid** - Professional, reliable, good free tier

### For SMS:
**MSG91** - Best pricing for India, reliable delivery

### Implementation:
1. Start with email notifications (easier, cheaper)
2. Add SMS for critical updates only (order confirmed, shipped)
3. Use Firebase Cloud Functions for automation
4. Monitor costs and adjust

---

## 🚀 Quick Start Commands

```bash
# Install dependencies in functions folder
cd functions
npm install @sendgrid/mail msg91-sms

# Set environment variables
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_KEY"
firebase functions:config:set msg91.key="YOUR_MSG91_KEY"
firebase functions:config:set twilio.sid="YOUR_TWILIO_SID"
firebase functions:config:set twilio.token="YOUR_TWILIO_TOKEN"

# Deploy functions
firebase deploy --only functions
```

---

**Would you like me to implement this notification system for you?** I can set up the complete email and SMS infrastructure! 🚀
