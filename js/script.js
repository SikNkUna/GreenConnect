"use strict";

const CONTACT_EMAIL = "hello@greenclimateconnect.co.za";
const STORAGE_KEY = "greenClimateConnectBasket";

const products = [
  {
    id: 1,
    name: "Recycled Bottle Bin",
    category: "home",
    price: 349,
    image: "images/bin.jpeg",
    description:
      "A spacious household recycling bin assembled from reclaimed plastic bottles."
  },
  {
    id: 2,
    name: "Cash Cow Savings Bank",
    category: "home",
    price: 129,
    image: "images/bank.jpeg",
    description:
      "A playful savings bank handmade from a reused plastic container and craft materials."
  },
  {
    id: 3,
    name: "Garden Bird Feeder",
    category: "garden",
    price: 99,
    image: "images/feeder.jpeg",
    description:
      "A simple hanging feeder made from a reclaimed container for garden birds."
  },
  {
    id: 4,
    name: "Recycled Bottle Broom",
    category: "cleaning",
    price: 149,
    image: "images/broom.jpeg",
    description:
      "A practical sweeping broom created with carefully cut reused plastic bottles."
  },
  {
    id: 5,
    name: "Woven Paper Flower Basket",
    category: "decor",
    price: 159,
    image: "images/vase.jpeg",
    description:
      "A colourful decorative basket woven by hand from reclaimed paper."
  },
  {
    id: 6,
    name: "Upcycled Bottle Stool",
    category: "home",
    price: 229,
    image: "images/stool.jpeg",
    description:
      "A lightweight display stool built from reused bottles with a durable circular top."
  }
];

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2
});

const elements = {
  productGrid: document.querySelector("#productGrid"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
  resultsCount: document.querySelector("#resultsCount"),
  emptyState: document.querySelector("#emptyState"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  basketButton: document.querySelector("#basketButton"),
  basketCount: document.querySelector("#basketCount"),
  basketDrawer: document.querySelector("#basketDrawer"),
  drawerBackdrop: document.querySelector("#drawerBackdrop"),
  closeBasketButton: document.querySelector("#closeBasketButton"),
  basketItems: document.querySelector("#basketItems"),
  basketEmpty: document.querySelector("#basketEmpty"),
  basketTotal: document.querySelector("#basketTotal"),
  checkoutButton: document.querySelector("#checkoutButton"),
  clearBasketButton: document.querySelector("#clearBasketButton"),
  toast: document.querySelector("#toast"),
  menuButton: document.querySelector("#menuButton"),
  mainNavigation: document.querySelector("#mainNavigation"),
  contactForm: document.querySelector("#contactForm"),
  currentYear: document.querySelector("#currentYear")
};

let activeCategory = "all";
let searchTerm = "";
let basket = loadBasket();
let toastTimer;

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function loadBasket() {
  try {
    const storedBasket = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(storedBasket) ? storedBasket : [];
  } catch (error) {
    return [];
  }
}

function saveBasket() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProducts() {
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.category === activeCategory;

    const searchableText =
      `${product.name} ${product.description} ${product.category}`.toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  elements.productGrid.innerHTML = filteredProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image">
            <img
              src="${escapeHtml(product.image)}"
              alt="${escapeHtml(product.name)}"
              loading="lazy"
            >
            <span class="product-category">${escapeHtml(product.category)}</span>
          </div>

          <div class="product-content">
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-description">
              ${escapeHtml(product.description)}
            </p>

            <div class="product-footer">
              <span class="product-price">
                ${formatCurrency(product.price)}
              </span>

              <button
                class="add-button"
                type="button"
                data-add-product="${product.id}"
                aria-label="Add ${escapeHtml(product.name)} to basket"
              >
                Add to basket
              </button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  const productWord = filteredProducts.length === 1 ? "product" : "products";
  elements.resultsCount.textContent =
    `${filteredProducts.length} ${productWord} found`;

  elements.emptyState.hidden = filteredProducts.length !== 0;
  elements.productGrid.hidden = filteredProducts.length === 0;
}

function addToBasket(productId) {
  const existingItem = basket.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    basket.push({ productId, quantity: 1 });
  }

  saveBasket();
  renderBasket();

  const product = getProduct(productId);
  showToast(`${product.name} added to your basket.`);
}

function changeQuantity(productId, amount) {
  const item = basket.find((basketItem) => basketItem.productId === productId);

  if (!item) {
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    basket = basket.filter(
      (basketItem) => basketItem.productId !== productId
    );
  }

  saveBasket();
  renderBasket();
}

function removeFromBasket(productId) {
  const product = getProduct(productId);

  basket = basket.filter(
    (basketItem) => basketItem.productId !== productId
  );

  saveBasket();
  renderBasket();

  if (product) {
    showToast(`${product.name} removed from your basket.`);
  }
}

function clearBasket() {
  if (basket.length === 0) {
    return;
  }

  basket = [];
  saveBasket();
  renderBasket();
  showToast("Your basket has been cleared.");
}

function renderBasket() {
  const validBasketItems = basket
    .map((item) => ({
      ...item,
      product: getProduct(item.productId)
    }))
    .filter((item) => item.product);

  const itemCount = validBasketItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const total = validBasketItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  elements.basketCount.textContent = itemCount;
  elements.basketCount.setAttribute(
    "aria-label",
    `${itemCount} ${itemCount === 1 ? "item" : "items"}`
  );

  elements.basketItems.innerHTML = validBasketItems
    .map(
      ({ product, quantity }) => `
        <article class="basket-item">
          <img
            src="${escapeHtml(product.image)}"
            alt=""
          >

          <div>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="basket-item-price">
              ${formatCurrency(product.price)}
            </p>

            <div
              class="quantity-control"
              aria-label="Quantity controls for ${escapeHtml(product.name)}"
            >
              <button
                type="button"
                data-decrease="${product.id}"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>${quantity}</span>

              <button
                type="button"
                data-increase="${product.id}"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            class="remove-item"
            type="button"
            data-remove="${product.id}"
            aria-label="Remove ${escapeHtml(product.name)}"
          >
            Remove
          </button>
        </article>
      `
    )
    .join("");

  const isEmpty = validBasketItems.length === 0;

  elements.basketItems.hidden = isEmpty;
  elements.basketEmpty.hidden = !isEmpty;
  elements.basketTotal.textContent = formatCurrency(total);
  elements.checkoutButton.disabled = isEmpty;
  elements.clearBasketButton.hidden = isEmpty;
}

function openBasket() {
  elements.drawerBackdrop.hidden = false;
  elements.basketDrawer.classList.add("open");
  elements.basketDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");

  requestAnimationFrame(() => {
    elements.drawerBackdrop.classList.add("visible");
  });

  elements.closeBasketButton.focus();
}

function closeBasket() {
  elements.basketDrawer.classList.remove("open");
  elements.basketDrawer.setAttribute("aria-hidden", "true");
  elements.drawerBackdrop.classList.remove("visible");
  document.body.classList.remove("drawer-open");

  window.setTimeout(() => {
    elements.drawerBackdrop.hidden = true;
  }, 220);
}

function checkout() {
  if (basket.length === 0) {
    showToast("Your basket is empty.");
    return;
  }

  const orderLines = basket
    .map((item) => {
      const product = getProduct(item.productId);

      if (!product) {
        return null;
      }

      const subtotal = product.price * item.quantity;

      return `- ${product.name} x ${item.quantity}: ${formatCurrency(subtotal)}`;
    })
    .filter(Boolean);

  const total = basket.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);

  const subject = "GreenClimateConnect product enquiry";
  const body = [
    "Hello GreenClimateConnect,",
    "",
    "I would like to enquire about the following products:",
    "",
    ...orderLines,
    "",
    `Estimated total: ${formatCurrency(total)}`,
    "",
    "My name:",
    "My contact number:",
    "Collection or delivery preference:",
    "",
    "Thank you."
  ].join("\n");

  window.location.href =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);

  elements.toast.textContent = message;
  elements.toast.classList.add("visible");

  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2800);
}

function resetFilters() {
  activeCategory = "all";
  searchTerm = "";
  elements.searchInput.value = "";

  document.querySelectorAll(".filter-button").forEach((button) => {
    button.classList.toggle(button.dataset.category === "all");
  });

  renderProducts();
}

function toggleMobileMenu() {
  const isOpen = elements.mainNavigation.classList.toggle("open");

  elements.menuButton.setAttribute("aria-expanded", String(isOpen));
  elements.menuButton.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );
}

function closeMobileMenu() {
  elements.mainNavigation.classList.remove("open");
  elements.menuButton.setAttribute("aria-expanded", "false");
  elements.menuButton.setAttribute("aria-label", "Open navigation");
}

function submitContactForm(event) {
  event.preventDefault();

  const name = document.querySelector("#contactName").value.trim();
  const email = document.querySelector("#contactEmail").value.trim();
  const message = document.querySelector("#contactMessage").value.trim();

  const subject = `Website enquiry from ${name}`;
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message
  ].join("\n");

  window.location.href =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
}

elements.productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");

  if (!button) {
    return;
  }

  addToBasket(Number(button.dataset.addProduct));
});

elements.categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;

  document.querySelectorAll(".filter-button").forEach((filterButton) => {
    filterButton.classList.toggle("active", filterButton === button);
  });

  renderProducts();
});

elements.searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderProducts();
});

elements.basketItems.addEventListener("click", (event) => {
  const increaseButton = event.target.closest("[data-increase]");
  const decreaseButton = event.target.closest("[data-decrease]");
  const removeButton = event.target.closest("[data-remove]");

  if (increaseButton) {
    changeQuantity(Number(increaseButton.dataset.increase), 1);
  }

  if (decreaseButton) {
    changeQuantity(Number(decreaseButton.dataset.decrease), -1);
  }

  if (removeButton) {
    removeFromBasket(Number(removeButton.dataset.remove));
  }
});

elements.basketButton.addEventListener("click", openBasket);
elements.closeBasketButton.addEventListener("click", closeBasket);
elements.drawerBackdrop.addEventListener("click", closeBasket);
elements.checkoutButton.addEventListener("click", checkout);
elements.clearBasketButton.addEventListener("click", clearBasket);
elements.clearFiltersButton.addEventListener("click", resetFilters);
elements.menuButton.addEventListener("click", toggleMobileMenu);
elements.contactForm.addEventListener("submit", submitContactForm);

elements.mainNavigation.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    closeMobileMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    elements.basketDrawer.classList.contains("open")
  ) {
    closeBasket();
    elements.basketButton.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) {
    closeMobileMenu();
  }
});

elements.currentYear.textContent = new Date().getFullYear();

renderProducts();
renderBasket();
