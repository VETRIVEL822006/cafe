
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware: understand JSON and serve frontend files
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Sample menu
const menu = [
  { id: 1, name: "Burger", price: 120 },
  { id: 2, name: "Pizza", price: 200 },
  { id: 3, name: "Coffee", price: 60 },
  { id: 4, name: "Sandwich", price: 100 }
];

// Temporary storage (resets when server restarts)
let orders = [];
let nextOrderId = 1;

// GET: send menu to browser
app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// POST: receive a customer order
app.post("/api/orders", (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Please select at least one item."
    });
  }

  const orderItems = [];

  for (const item of items) {
    const product = menu.find(
      (food) => food.id === item.id
    );

    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 50
    ) {
      return res.status(400).json({
        error: "Invalid item or quantity."
      });
    }

    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity
    });
  }

  const total = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = {
    id: nextOrderId++,
    items: orderItems,
    total,
    status: "Received",
    createdAt: new Date().toISOString()
  };

  orders.push(order);

  console.log("New order received:", order);

  res.status(201).json({
    message: "Order placed successfully!",
    order
  });
});

// GET: owner views all orders
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

// PATCH: owner updates order status
app.patch("/api/orders/:id", (req, res) => {
  const allowedStatuses = [
    "Received",
    "Preparing",
    "Ready",
    "Completed"
  ];

  const order = orders.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!order) {
    return res.status(404).json({
      error: "Order not found."
    });
  }

  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid order status."
    });
  }

  order.status = status;

  res.json({
    message: "Order status updated.",
    order
  });
});

// Start server
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
