
const menuElement = document.getElementById("menu");
const cartElement = document.getElementById("cart");
const totalElement = document.getElementById("total");
const messageElement = document.getElementById("message");
const connectionElement = document.getElementById("connection");

let menu = [];
const cart = {};

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function loadMenu() {
  try {
    menu = await api("/api/menu");
    connectionElement.textContent = "🟢 Server connected";
    renderMenu();
    renderCart();
  } catch (error) {
    connectionElement.textContent = "🔴 Server connection failed";
    messageElement.textContent = error.message;
  }
}

function renderMenu() {
  menuElement.replaceChildren();

  menu.forEach((food) => {
    const card = document.createElement("article");
    card.className = "food-card";

    const name = document.createElement("h3");
    name.textContent = food.name;

    const price = document.createElement("p");
    price.textContent = `₹${food.price}`;

    const button = document.createElement("button");
    button.textContent = "Add to Cart";
    button.addEventListener("click", () => {
      cart[food.id] = (cart[food.id] || 0) + 1;
      renderCart();
    });

    card.append(name, price, button);
    menuElement.appendChild(card);
  });
}

function renderCart() {
  cartElement.replaceChildren();
  let total = 0;
  let hasItems = false;

  menu.forEach((food) => {
    const quantity = cart[food.id] || 0;
    if (quantity === 0) return;

    hasItems = true;
    total += food.price * quantity;

    const line = document.createElement("p");
    line.textContent =
      `${food.name} × ${quantity} = ₹${food.price * quantity}`;

    const remove = document.createElement("button");
    remove.textContent = "Remove one";
    remove.addEventListener("click", () => {
      cart[food.id]--;
      if (cart[food.id] <= 0) delete cart[food.id];
      renderCart();
    });

    line.append(" ", remove);
    cartElement.appendChild(line);
  });

  if (!hasItems) {
    cartElement.textContent = "Your cart is empty.";
  }

  totalElement.textContent = total;
}

document.getElementById("placeOrder").addEventListener(
  "click",
  async () => {
    const items = Object.entries(cart).map(([id, quantity]) => ({
      id: Number(id),
      quantity
    }));

    if (items.length === 0) {
      messageElement.textContent = "Add an item first.";
      return;
    }

    try {
      const result = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items })
      });

      messageElement.textContent =
        `${result.message} Order #${result.order.id}`;

      Object.keys(cart).forEach((id) => delete cart[id]);
      renderCart();
    } catch (error) {
      messageElement.textContent = error.message;
    }
  }
);

async function loadOrders() {
  const ordersElement = document.getElementById("orders");
  ordersElement.replaceChildren();

  try {
    const orders = await api("/api/orders");

    if (orders.length === 0) {
      ordersElement.textContent = "No orders received yet.";
      return;
    }

    orders.forEach((order) => {
      const card = document.createElement("article");
      card.className = "order-card";

      const title = document.createElement("h3");
      title.textContent = `Order #${order.id}`;

      const details = document.createElement("p");
      details.textContent = order.items.map(
        (item) => `${item.name} × ${item.quantity}`
      ).join(", ");

      const total = document.createElement("p");
      total.textContent = `Total: ₹${order.total}`;

      const status = document.createElement("p");
      status.textContent = `Status: ${order.status}`;

      const select = document.createElement("select");

      ["Received", "Preparing", "Ready", "Completed"].forEach(
        (value) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        }
      );

      select.value = order.status;

      const update = document.createElement("button");
      update.textContent = "Update Status";

      update.addEventListener("click", async () => {
        try {
          await api(`/api/orders/${order.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: select.value })
          });

          await loadOrders();
        } catch (error) {
          alert(error.message);
        }
      });

      card.append(title, details, total, status, select, update);
      ordersElement.appendChild(card);
    });
  } catch (error) {
    ordersElement.textContent = `Error: ${error.message}`;
  }
}

document.getElementById("customerTab").addEventListener("click", () => {
  document.getElementById("customerSection").hidden = false;
  document.getElementById("ownerSection").hidden = true;
});

document.getElementById("ownerTab").addEventListener("click", () => {
  document.getElementById("customerSection").hidden = true;
  document.getElementById("ownerSection").hidden = false;
  loadOrders();
});

document.getElementById("refreshOrders").addEventListener(
  "click", loadOrders
);

loadMenu();
