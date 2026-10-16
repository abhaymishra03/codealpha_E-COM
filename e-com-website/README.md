# ShopLocal — simple e-commerce store

A small full-stack storefront built with HTML, CSS, vanilla JavaScript, Express, and MongoDB.

## What’s included

- Responsive product listing with category filters, search, badges, and quick add-to-bag.
- Product detail pages and a shopping bag that stays saved in the browser.
- Account registration and login. Passwords are hashed before they are stored.
- MongoDB collections for products, users, and orders. Order totals are calculated from database prices, and stock is checked when an order is placed.
- A sample product catalog and a demo shipping checkout.

The checkout does **not** collect payment. Add a payment provider before using this for real transactions.

## Requirements

- Node.js 18 or newer and npm.
- A MongoDB database, either a local MongoDB server or a MongoDB Atlas connection string.

## Run it locally

1. Open a terminal in this project folder.
2. Install packages: `npm install`
3. Copy `.env.example` to `.env`.
4. Open `.env` and set `MONGODB_URI` to your MongoDB connection string. Replace `JWT_SECRET` with a long, random secret (at least 24 characters). Keep `.env` private; it is excluded from Git.
5. Start MongoDB (if using a local database).
6. Add the sample products: `npm run seed`
7. Start the site: `npm run dev` (or `npm start`)
8. Visit `http://localhost:3000`.

For MongoDB Atlas, create a database user, allow your current IP in Network Access, and copy the driver connection string into `MONGODB_URI`. Replace the username, password, and database name in that string with your own values. Do not send your credentials in chat or commit them to source control.

## Environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `PORT` | Local web server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shoplocal` |
| `JWT_SECRET` | Secret used to sign login tokens | Long random private value |
| `NODE_ENV` | Runtime environment | `development` |

## API overview

- `GET /api/health` — application and database status.
- `GET /api/products` — product list; accepts `?category=Home` and `?search=mug`.
- `GET /api/products/:id` — product details.
- `POST /api/auth/register` and `POST /api/auth/login` — account access.
- `POST /api/orders` — authenticated order placement.
- `GET /api/orders/mine` — authenticated user's orders.

Authenticated endpoints expect `Authorization: Bearer <token>`.
