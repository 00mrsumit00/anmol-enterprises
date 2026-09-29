# ?? Anmol Frozen Express � Complete Project Overview

> **Built by:** Anmol Enterprises, Latur, Maharashtra, India
> **Domain:** Quick-Commerce Frozen Food Distribution Platform
> **Live at:** http://localhost:3000 (development)

---

## ?? What Is This Project?

**Anmol Frozen Express** is a full-stack, production-ready **quick-commerce web application** built specifically for **Anmol Enterprises** � an authorized distributor of **McCain Foods India** based in **Latur, Maharashtra**.

Think of it as a **Blinkit / BigBasket clone**, but purpose-built for one business: selling and delivering frozen food products (French Fries, Smiles, Aloo Tikki, Cheese Shotz, Nuggets, Wedges, etc.) to both **individual consumers (B2C)** and **bulk wholesale buyers (B2B)** such as hotels, cafes, restaurants, and fast-food counters in and around Latur.

---

## ?? Main Goal

> **Build a complete digital ordering + dispatch platform that replaces manual phone orders and WhatsApp-based business operations for Anmol Enterprises.**

### What We Want to Achieve:

| Goal | Description |
|------|-------------|
| ?? Online Storefront | Let customers browse and order McCain frozen products 24x7 |
| ?? B2B Wholesale Portal | Allow hotels/cafes to see bulk pricing (BOX, CARTON) and place large orders |
| ?? Order Management | Admin can track, confirm, pack, and dispatch every order |
| ?? Driver Dispatch | Assign delivery drivers to packed orders |
| ?? Real-Time Updates | Customers and admin both see live order status changes |
| ?? PWA Support | Works like a mobile app � installable on phone homescreen |
| ?? Secure Auth | Phone + password login with role-based access (Admin / Staff / Customer) |

---

## ?? Business Context

| Detail | Info |
|--------|------|
| Company Name | Anmol Enterprises |
| Location | Latur, Maharashtra, India |
| Product Brand | McCain Foods India |
| Business Type | Authorized Regional Distributor |
| Customer Types | Individual consumers + Hotels, Cafes, Restaurants (B2B) |
| Delivery Area | Latur City, Osmanabad, Nanded, Bidar |
| Operating Hours | 9:00 AM � 8:00 PM |
| Delivery Slots | Morning and Evening |
| Contact | +91 94220 70000, contact@anmolexpress.in |

---

## ?? What We Are Building � Feature Breakdown

### 1. Customer Storefront (Public)

This is the face of the business � what customers see and use.

- **Homepage** � Hero banner, category filter chips, featured products carousel (McCain Specials), full product grid
- **Product Cards** � Blinkit-style cards showing product image, delivery time (8 MINS), discount % badge, weight, price, MRP, and ADD/stepper button
- **Product Detail Page** � Full product page with 5 gallery views, Product ID, SKU code, pack variant selector (Single/Box/Carton), pricing, Add to Cart CTA
- **Category Pages** � Browse products by category (Frozen Potato Snacks, Cheese & Veggie Bites) with filters and sorting
- **Search** � Search across all McCain products
- **Cart Drawer** � Slide-over cart panel showing items, bill breakdown (subtotal, savings, delivery fee, handling charge, grand total)
- **Checkout Flow** � Address selection, delivery slot picker (Morning/Evening), payment method, order confirmation
- **Order Tracking** � Customers can track their order status live via Socket.io
- **Account Management** � Register, login, manage saved addresses, view order history

---

### 2. B2B Wholesale Mode

A special mode toggled via the navbar for bulk buyers:

- **Wholesale Pricing** � Automatically shows B2B prices instead of retail when toggled ON
- **Bulk Pack Options** � BOX (x10 units) and CARTON (x50 units) variants with B2B discounted pricing
- **Credit Account Payments** � B2B customers can order on credit against a set credit limit
- **B2B Banner** � Dedicated promotional section to onboard business clients

---

### 3. Admin Dispatcher Board (Protected)

A separate admin portal accessible only to ADMIN and STAFF roles at /admin.

| Module | Function |
|--------|----------|
| Orders Dispatch | View all orders, filter by status/date, update order status, print invoices |
| Product List | View and manage the McCain product catalog |
| Inventory Manager | Quick-edit stock levels per variant, bulk-add stock across all packaging types |
| Driver List | Add, view, and manage delivery drivers and their vehicle details |

The admin uses Socket.io to receive live notifications (new_order, order_list_update) � when a customer places an order, the admin dashboard instantly shows it without page refresh.

---

### 4. Real-Time Communication Layer

Built using Socket.io rooms:

| Room / Event | Purpose |
|--------------|---------|
| join_admin | Admin joins a private room for live order alerts |
| join_order | Customer joins a room to track their specific order |
| new_order | Fires to admin room when a customer places an order |
| order_status_update | Fires to customer when admin changes their order status |
| stock_update | Fires when inventory is adjusted |
| pwa_push | Sends PWA push notification payload |

---

## ??? Database Design (Prisma + SQLite)

The database uses SQLite locally (via Prisma ORM). It is designed to scale to PostgreSQL for production.

### Models:

```
User            ? Customers, Staff, Admins. Supports B2B flag, credit limit
Session         ? JWT token sessions (httpOnly cookie)
Address         ? Customer delivery addresses (Home/Office/Other)
Category        ? Product categories (Frozen Potato Snacks, Cheese & Veggie Bites)
Product         ? McCain products with name, slug, description, image, featured flag
ProductVariant  ? SINGLE / BOX / CARTON packaging with retail + B2B prices, stock count
Driver          ? Delivery drivers with vehicle details
Order           ? Full order record with address snapshot, payment, delivery slot, fees
OrderItem       ? Line items per order (price snapshot at time of purchase)
OrderStatusLog  ? Audit trail of every status change with timestamp and actor
```

### Order Status Lifecycle:

```
PENDING ? CONFIRMED ? PACKING ? PACKED ? ASSIGNED ? OUT_FOR_DELIVERY ? DELIVERED
                                                                      ? CANCELLED
```

### Product Variants (Pack Tiers):

| Packaging | Units | Typical Weight | Price Type |
|-----------|-------|----------------|------------|
| SINGLE | 1 pack | 300g � 520g | Retail and B2B |
| BOX | 10 packs | 3kg � 5kg | Retail and B2B |
| CARTON | 50 packs | 15kg � 26kg | B2B Only (practical) |

---

## ?? Pricing & Fee Structure

| Item | Rule |
|------|------|
| Retail Price | Standard MRP for B2C customers |
| B2B Price | 10�20% cheaper than retail, for bulk buyers |
| Delivery Fee | Rs30 free on orders above Rs1,000 |
| Cold Handling Fee | Fixed Rs5�Rs10 (temperature-controlled logistics) |
| Cold Chain MRP Markup | Products shown at ~15% above activePrice as crossed MRP |

---

## ?? Payment Methods

| Method | Who Can Use |
|--------|------------|
| Cash on Delivery (COD) | All customers |
| UPI | All customers |
| Card | All customers |
| Credit Account | B2B customers only (with credit limit validation) |

---

## ?? Product Catalog (12 Products x 3 Variants = 36 SKUs)

### Category 1: Frozen Potato Snacks

| Product | SKU (Single) | Retail | B2B |
|---------|-------------|--------|-----|
| McCain French Fries (420g) | MCN-FF-420 | Rs199 | Rs169 |
| McCain Aloo Tikki (400g) | MCN-AT-400 | Rs179 | Rs149 |
| McCain Veggie Nuggets (400g) | MCN-VN-400 | Rs209 | Rs179 |
| McCain Smiles (415g) | MCN-SM-415 | Rs189 | Rs159 |
| McCain Chilli Garlic Potato Bites (400g) | MCN-CGB-400 | Rs219 | Rs184 |
| McCain Super Wedges (520g) | MCN-SW-520 | Rs239 | Rs199 |
| McCain Masala Fries (420g) | MCN-MF-420 | Rs209 | Rs175 |
| McCain Veggie Burger Patty (300g) | MCN-VBP-300 | Rs199 | Rs169 |

### Category 2: Cheese & Veggie Bites

| Product | SKU (Single) | Retail | B2B |
|---------|-------------|--------|-----|
| McCain Potato Cheese Shotz (400g) | MCN-PCS-400 | Rs269 | Rs229 |
| McCain Chilli Cheesy Nuggets (420g) | MCN-CCN-420 | Rs249 | Rs211 |
| McCain Veggie Fingers (400g) | MCN-VF-400 | Rs229 | Rs195 |
| McCain Cheese Pizza Mini Samosa (300g) | MCN-CPS-300 | Rs259 | Rs219 |

---

## ??? Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.35 | React framework with App Router, SSR/SSG |
| React | 18 | UI component library |
| Tailwind CSS | 3.4 | Utility-first CSS styling |
| Framer Motion | 12.x | Animations and micro-interactions |
| Redux Toolkit | 2.x | Global cart state management |
| TanStack React Query | 5.x | Server state, API data fetching and caching |
| Socket.io Client | 4.8 | Real-time WebSocket communication |
| Lucide React | 1.x | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | 5.x | REST API server |
| Socket.io | 4.8 | WebSocket real-time server |
| Prisma ORM | 5.14 | Type-safe database access |
| SQLite | via Prisma | Local development database |
| bcryptjs | 3.x | Password hashing |
| jsonwebtoken | 9.x | JWT token signing and verification |
| Zod | 4.x | Runtime request schema validation |
| cookie-parser | 1.4 | HTTP cookie parsing |
| cors | 2.8 | Cross-Origin Resource Sharing |

### Dev Tools

| Technology | Purpose |
|-----------|---------|
| TypeScript | Type safety across entire codebase |
| TSX | Run TypeScript directly (no build step for dev) |
| Prisma Studio | Visual database explorer |
| ESLint | Code quality linting |

---

## ??? Architecture � How It All Works Together

Everything runs on a SINGLE PORT (3000).
Express handles /api/* routes, and Next.js handles all page routes.
This was done using a custom server.ts instead of Next.js default dev server.

```
Browser (Next.js 14 App Router)
     |
     v
server.ts  (Single Entry Point on Port 3000)
     |
     +--- Express.js REST API  (/api/*)
     |         |
     |         +--- lib/backend.ts  (All route handlers)
     |                   |
     |                   +--- lib/prisma.ts --> dev.db (SQLite)
     |
     +--- Socket.io Server (Admin + Order Rooms)
     |
     +--- Next.js (all page routes: /, /product/[slug], /admin/*, etc.)
```

---

## ?? Project Folder Structure

```
Anmol Enterprises/
|
+-- server.ts                    ? Main entry point (Express + Socket.io + Next.js)
+-- prisma/
|   +-- schema.prisma            ? Database models
|   +-- seed.ts                  ? Seed 12 products and 36 variants
|   +-- dev.db                   ? SQLite database file
|
+-- lib/
|   +-- backend.ts               ? All Express API route handlers (~700 lines)
|   +-- auth.ts                  ? JWT sign/verify, auth middleware, role guard
|   +-- prisma.ts                ? Prisma client singleton
|
+-- app/
|   +-- layout.tsx               ? Root layout with providers, PWA meta
|   +-- globals.css              ? Global Tailwind + custom CSS
|   |
|   +-- (storefront)/            ? Public customer-facing pages
|   |   +-- page.tsx             ? Homepage
|   |   +-- layout.tsx           ? Storefront layout (Navbar + CartDrawer)
|   |   +-- product/[slug]/      ? Product detail page
|   |   +-- category/[slug]/     ? Category listing page
|   |   +-- search/              ? Search results page
|   |   +-- checkout/            ? Checkout flow
|   |   +-- account/             ? Login/Register + profile
|   |   +-- order/[id]/          ? Live order tracking
|   |
|   +-- (admin)/                 ? Protected admin portal
|   |   +-- layout.tsx           ? Admin layout (sidebar nav, auth guard)
|   |   +-- admin/
|   |       +-- login/           ? Admin login page
|   |       +-- orders/          ? Order management and dispatch
|   |       +-- products/        ? Product catalog management
|   |       +-- inventory/       ? Stock level management
|   |       +-- drivers/         ? Driver management
|   |
|   +-- api/                     ? Next.js App Router API routes
|       +-- products/route.ts    ? GET /api/products
|       +-- products/[slug]/     ? GET /api/products/:slug
|       +-- categories/route.ts  ? GET /api/categories
|
+-- components/
|   +-- storefront/
|   |   +-- Navbar.tsx           ? Top navigation with search, cart pill, B2B toggle
|   |   +-- CartDrawer.tsx       ? Slide-over cart panel
|   |   +-- ProductCard.tsx      ? Blinkit-style product card
|   |   +-- ProductGrid.tsx      ? Responsive grid of product cards
|   |   +-- McCainPackageVisual  ? SVG-style McCain package art (per product)
|   |   +-- HeroBanner.tsx       ? Animated hero carousel
|   |   +-- CategoryStrip.tsx    ? Horizontal category filter chips
|   |   +-- TrustStrip.tsx       ? Trust badges (delivery, quality, etc.)
|   |   +-- B2BBanner.tsx        ? B2B onboarding banner
|   |   +-- SlotPicker.tsx       ? Morning/Evening delivery slot picker
|   +-- ui/
|       +-- Toast.tsx            ? Toast notification system
|
+-- hooks/
|   +-- useCart.ts               ? Redux cart operations hook
|   +-- useSocket.ts             ? Socket.io client connection hook
|
+-- store/
|   +-- index.ts                 ? Redux store setup
|   +-- cartSlice.ts             ? Cart state slice (items, B2B mode, open/close)
|
+-- docs/
|   +-- postman_collection.json  ? API test collection (31 endpoints)
|
+-- public/                      ? Static assets, PWA manifest, icons
```

---

## ?? Authentication & Authorization

### How Auth Works:
1. User registers or logs in with phone number + password
2. Server verifies credentials, hashes password with bcrypt
3. On success, a JWT token is issued and stored as an httpOnly cookie (7-day expiry)
4. Every protected API call reads the cookie, verifies the JWT, and attaches req.user
5. Role guards (requireRole) protect admin-only endpoints

### Roles:
| Role | Access |
|------|--------|
| CUSTOMER | Browse, cart, checkout, view own orders |
| STAFF | Everything customer can do + view all orders, update order status |
| ADMIN | Full access � all of the above + manage products, inventory, drivers |

**Special Rule:** The very first user to register automatically becomes ADMIN.

---

## ??? All Pages & Routes

### Storefront (Public)
| Route | Page |
|-------|------|
| / | Homepage with hero, featured products, full catalog |
| /product/[slug] | Product detail page |
| /category/[slug] | Products filtered by category |
| /search?q=... | Search results |
| /checkout | Checkout form (address, slot, payment) |
| /account | Login / Register / Profile / Order History |
| /order/[id] | Live order tracking page |

### Admin (Protected � ADMIN/STAFF only)
| Route | Page |
|-------|------|
| /admin/login | Admin login |
| /admin/orders | Order queue and dispatch board |
| /admin/products | Product catalog management |
| /admin/inventory | Stock level editor |
| /admin/drivers | Driver roster management |

---

## ?? API Endpoints (All prefixed with /api)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login with phone + password |
| POST | /auth/logout | Logout (clear cookie) |
| GET | /auth/me | Get logged-in user info |

### Products & Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | Get all active products with variants |
| GET | /products/:slug | Get single product by slug (with fuzzy fallback) |
| GET | /categories | Get all active categories |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Create a new order (stock validated in transaction) |
| GET | /orders | Get current user's orders |
| GET | /orders/all | Admin: Get all orders |
| GET | /orders/:id | Get single order with status history |
| PUT | /orders/:id/status | Admin: Update order status |
| PUT | /orders/:id/assign | Admin: Assign driver to order |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | /inventory/quick-edit | Update stock for a single variant |
| PUT | /inventory/bulk-add | Add stock to all variants of a pack type |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /drivers | List all drivers |
| POST | /drivers | Add a new driver |
| PUT | /drivers/:id | Update driver details |

---

## ?? State Management

| State Type | Tool | What It Manages |
|-----------|------|----------------|
| Cart State | Redux Toolkit | Cart items, B2B mode toggle, cart drawer open/close |
| Server Data | TanStack React Query | Products, categories, orders (cached and auto-refetched) |
| Local UI State | React useState | Filters, modals, form inputs, selected variants |
| Real-time State | Socket.io | Live order updates, new order alerts |

---

## ?? Progressive Web App (PWA)

The app is configured as a PWA using @ducanh2912/next-pwa:
- Installable on Android/iOS home screens
- Offline-capable (service worker)
- App-like experience without downloading from Play Store / App Store
- PWA push notifications for order status updates (Firebase FCM � mock in dev)

---

## ?? Third-Party Integrations (Configured, Mock in Dev)

| Service | Purpose | Status |
|---------|---------|--------|
| Cloudinary | Product image storage and CDN | Mock API keys in .env |
| Razorpay | UPI / Card payment gateway | Mock keys � needs real keys for production |
| MSG91 | SMS notifications (order confirmation) | Mock � needs real auth key |
| Firebase FCM | PWA push notifications | Mock � needs real service account |

---

## ? What Has Been Built So Far

| Feature | Status |
|---------|--------|
| Full product catalog (12 products, 36 variants) | DONE |
| Blinkit-style product cards | DONE |
| Product detail pages with gallery | DONE |
| Cart drawer with bill breakdown | DONE |
| Green cart pill in Navbar | DONE |
| B2B mode toggle with wholesale pricing | DONE |
| Checkout flow | DONE |
| User authentication (register/login/logout) | DONE |
| Admin order management board | DONE |
| Inventory management | DONE |
| Driver management | DONE |
| Real-time Socket.io order updates | DONE |
| PWA configuration | DONE |
| Postman API collection | DONE |

---

## ?? What Still Needs to Be Built / Improved

| Feature | Priority | Notes |
|---------|----------|-------|
| Real product images from Cloudinary | HIGH | Currently using CSS/SVG package visuals |
| Razorpay payment integration | HIGH | Replace mock keys with production keys |
| SMS via MSG91 | MEDIUM | Real order confirmations to customers |
| Firebase push notifications | MEDIUM | Order status push to customer phones |
| Customer address autocomplete | MEDIUM | Google Maps / India post pin API |
| Order invoice PDF generation | MEDIUM | Printable invoice from admin panel |
| Admin analytics dashboard | MEDIUM | Revenue, top products, daily orders chart |
| Customer order tracking map | LOW | Live driver location |
| Migrate SQLite to PostgreSQL | HIGH | Required before production deployment |
| Deploy to cloud (Vercel + Railway) | HIGH | Make it live on the internet |

---

## ?? How to Run the Project

### 1. Install Dependencies
```
npm install
```

### 2. Set Up Environment Variables (.env already configured for dev)
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="anmol-frozen-express-super-secret-key..."
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 3. Generate Prisma Client and Push Schema
```
npx prisma generate
npx prisma db push
```

### 4. Seed the Database (12 McCain Products)
```
npx prisma db seed
```

### 5. Start the Dev Server
```
npm run dev
```

### 6. Open in Browser
```
http://localhost:3000          ?  Customer Storefront
http://localhost:3000/admin    ?  Admin Portal (login first)
```

---

## ?? Test Accounts

To create an ADMIN account, register the FIRST user via /account. They will automatically get ADMIN role.

Register via API:
```
POST http://localhost:3000/api/auth/register
{
  "name": "Anmol Admin",
  "phone": "9876543210",
  "password": "<YOUR_ADMIN_PASSWORD>"
}
```

---

## ?? Design System

The UI is inspired by Blinkit (formerly Grofers) � India's leading quick-commerce app.

| Design Element | Value |
|---------------|-------|
| Primary Green | #0c831f (Blinkit-style action green) |
| Secondary Blue | #2563eb (discount badges) |
| Background | #f4f6f8 (light gray page bg) |
| Card Radius | rounded-2xl / rounded-3xl |
| Font | System sans-serif + bold weights |
| Card Style | White card, subtle border, hover shadow |
| ADD Button | White background, green border ? solid green on add |
| Cart Pill | Solid green with item count + total |
| Discount Badge | Blue top-left ribbon on product card |

---

## ?? Summary

Anmol Frozen Express is not just a website � it is a complete business operating system for a frozen food distributor. It handles:

- Customer-facing: Browse ? Add to Cart ? Checkout ? Track Order
- B2B Wholesale: Toggle pricing ? Bulk packs ? Credit account orders
- Backend Operations: Admin confirms ? Staff packs ? Driver picks up ? Order delivered
- Real-time awareness: Admin and customer always know what is happening via Socket.io
- Inventory control: Stock decrements on order, increments on cancellation

The entire system is built to be maintainable, scalable, and ready for production deployment with minimal additional configuration.

---

Last Updated: August 2026 | Built with Next.js 14, Express.js, Prisma, Socket.io, and TypeScript
