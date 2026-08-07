/* =============================================================
   JOHN EMPRESA — Catálogo de inventario (Conectado a MySQL)
   ============================================================= */

(function () {
  "use strict";

  const API_URL = "https://john-empresa.onrender.com/api";
  const SERVER_ORIGIN = "https://john-empresa.onrender.com";
  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect width="200" height="160" fill="#eef2f5"/><path d="M70 100l20-24 18 20 14-16 28 32H70z" fill="#c7d5e0"/><circle cx="80" cy="62" r="10" fill="#c7d5e0"/></svg>'
    );

  function imageUrl(product) {
    return product && product.image_url ? product.image_url : PLACEHOLDER_IMAGE;
  }

  const COLOR_SWATCHES = {
    "azul marino": "#1b2a40", "azul": "#33587a", "celeste": "#8fb3cc",
    "negro": "#111214", "blanco": "#f5f5f4", "gris": "#7c8896",
    "gris claro": "#c3cbd3", "beige": "#cdb997", "camel": "#b08b5a",
    "café": "#5a4632", "marrón": "#5a4632", "verde": "#4c6b52",
    "verde oliva": "#5b6b4e", "rojo": "#8c3b3b", "vino": "#6b2f3a",
    "burdeos": "#6b2f3a", "rosa": "#c98fa0", "amarillo": "#c9a63f",
    "mostaza": "#af8a2e",
  };
  const DEFAULT_SWATCH = "#9fb4c7";

  const POINTS_OF_SALE = [
    { name: "John Empresa — Centro", mapsQuery: "John Empresa Centro Cochabamba Bolivia", address: "Plaza principal, Cercado, Cochabamba" },
    { name: "John Empresa — Cancha", mapsQuery: "John Empresa Cancha Cochabamba Bolivia", address: "Mercado La Cancha, Cochabamba" },
    { name: "John Empresa — Zona Norte", mapsQuery: "John Empresa Zona Norte Cochabamba Bolivia", address: "Av. Blanco Galindo, Cochabamba" },
  ];

  const state = {
    products: [],
    isAdmin: false,
    search: "",
    cart: [],
    currentView: "catalogo",
    orders: [],
    ordersLoaded: false,
  };

  const els = {
    searchInput: document.getElementById("searchInput"),
    catalogGrid: document.getElementById("catalogGrid"),
    emptyState: document.getElementById("emptyState"),
    statCount: document.getElementById("statCount"),
    statUnits: document.getElementById("statUnits"),
    wakeBanner: document.getElementById("wakeBanner"),
    adminControls: document.getElementById("adminControls"),
    addProductBtn: document.getElementById("addProductBtn"),

    menuBtn: document.getElementById("menuBtn"),
    drawer: document.getElementById("drawer"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    drawerClose: document.getElementById("drawerClose"),
    drawerPedidosLink: document.getElementById("drawerPedidosLink"),
    drawerCartBadge: document.getElementById("drawerCartBadge"),
    cartShortcutBtn: document.getElementById("cartShortcutBtn"),
    cartBadge: document.getElementById("cartBadge"),

    posGrid: document.getElementById("posGrid"),

    cartList: document.getElementById("cartList"),
    cartEmptyState: document.getElementById("cartEmptyState"),
    cartSummary: document.getElementById("cartSummary"),
    cartTotal: document.getElementById("cartTotal"),
    cartOrderBtn: document.getElementById("cartOrderBtn"),

    checkoutForm: document.getElementById("checkoutForm"),
    checkoutName: document.getElementById("checkoutName"),
    checkoutPhone: document.getElementById("checkoutPhone"),
    checkoutEmail: document.getElementById("checkoutEmail"),
    checkoutAddress: document.getElementById("checkoutAddress"),
    checkoutSubmitBtn: document.getElementById("checkoutSubmitBtn"),
    checkoutError: document.getElementById("checkoutError"),

    adminLoginBlock: document.getElementById("adminLoginBlock"),
    adminSessionBlock: document.getElementById("adminSessionBlock"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    logoutBtn: document.getElementById("logoutBtn"),

    ordersList: document.getElementById("ordersList"),
    ordersEmptyState: document.getElementById("ordersEmptyState"),

    productModalOverlay: document.getElementById("productModalOverlay"),
    productModalTitle: document.getElementById("productModalTitle"),
    productModalEyebrow: document.getElementById("productModalEyebrow"),
    productForm: document.getElementById("productForm"),
    productId: document.getElementById("productId"),
    productName: document.getElementById("productName"),
    productSize: document.getElementById("productSize"),
    productColor: document.getElementById("productColor"),
    productDescription: document.getElementById("productDescription"),
    productPrice: document.getElementById("productPrice"),
    productPriceError: document.getElementById("productPriceError"),
    productStock: document.getElementById("productStock"),
    productImage: document.getElementById("productImage"),
    productImagePreview: document.getElementById("productImagePreview"),
    productImageLabel: document.getElementById("productImageLabel"),
    productImageError: document.getElementById("productImageError"),
    productSubmitBtn: document.getElementById("productSubmitBtn"),

    detailModalOverlay: document.getElementById("detailModalOverlay"),
    detailContent: document.getElementById("detailContent"),

    toast: document.getElementById("toast"),
  };

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function normalize(str) {
    return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function swatchFor(color) {
    return COLOR_SWATCHES[normalize(color)] || DEFAULT_SWATCH;
  }

  // Acepta tanto coma como punto como separador decimal (ej. "150,50" o "150.50").
  // Devuelve un número válido >= 0, o null si el texto no es un precio válido.
  function parsePriceInput(rawValue) {
    const cleaned = String(rawValue).trim().replace(",", ".");
    if (cleaned === "") return null;
    const n = Number(cleaned);
    if (!isFinite(n) || n < 0) return null;
    return n;
  }

  function formatBs(amount) {
    const n = Number(amount) || 0;
    return "Bs " + n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  let toastTimer = null;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }

  /* -----------------------------------------------------------
     Reactivación del servidor (Render)
     ----------------------------------------------------------- */
  function showWakeBanner() { if (els.wakeBanner) els.wakeBanner.hidden = false; }
  function hideWakeBanner() { if (els.wakeBanner) els.wakeBanner.hidden = true; }

  async function pingServer() {
    try {
      await fetch(`${SERVER_ORIGIN}/api/health`, { cache: "no-store" });
    } catch (e) { /* silencioso */ }
  }

  /* -----------------------------------------------------------
     Persistencia API
     ----------------------------------------------------------- */
  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error("Error de red");
      state.products = await response.json();
    } catch (e) {
      console.error("Error al cargar inventario:", e);
      state.products = [];
    }
    render();
  }

  function loadSession() {
    const token = sessionStorage.getItem("je_token");
    state.isAdmin = !!token;
  }

  function saveSession(isAdmin) { state.isAdmin = isAdmin; }

  /* -----------------------------------------------------------
     Carrito — persistencia local
     ----------------------------------------------------------- */
  function loadCart() {
    try {
      const raw = localStorage.getItem("je_cart");
      state.cart = raw ? JSON.parse(raw) : [];
    } catch (e) { state.cart = []; }
  }

  function saveCart() {
    localStorage.setItem("je_cart", JSON.stringify(state.cart));
  }

  function cartQtyFor(productId) {
    const item = state.cart.find((c) => c.id == productId);
    return item ? item.qty : 0;
  }

  function cartTotalAmount() {
    return state.cart.reduce((sum, c) => sum + Number(c.price) * c.qty, 0);
  }

  function cartCount() {
    return state.cart.reduce((sum, c) => sum + c.qty, 0);
  }

  function addToCart(product) {
    const stock = Number(product.stock) || 0;
    const existing = state.cart.find((c) => c.id == product.id);
    if (existing) {
      if (stock > 0 && existing.qty >= stock) {
        showToast("No hay más unidades disponibles.");
        return;
      }
      existing.qty += 1;
    } else {
      if (stock <= 0) { showToast("Producto agotado."); return; }
      state.cart.push({
        id: product.id,
        name: product.name,
        size: product.size,
        color: product.color,
        price: Number(product.price) || 0,
        image_url: product.image_url || null,
        qty: 1,
      });
    }
    saveCart();
    render();
    renderCart();
    renderCartBadges();
  }

  function decrementCart(productId) {
    const item = state.cart.find((c) => c.id == productId);
    if (!item) return;
    item.qty -= 1;
    if (item.qty <= 0) state.cart = state.cart.filter((c) => c.id != productId);
    saveCart();
    render();
    renderCart();
    renderCartBadges();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((c) => c.id != productId);
    saveCart();
    render();
    renderCart();
    renderCartBadges();
  }

  function renderCartBadges() {
    const count = cartCount();
    [els.cartBadge, els.drawerCartBadge].forEach((el) => {
      if (!el) return;
      if (count > 0) {
        el.textContent = String(count);
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });
  }

  /* -----------------------------------------------------------
     Render — catálogo
     ----------------------------------------------------------- */
  function getFilteredProducts() {
    const term = normalize(state.search.trim());
    if (!term) return state.products;
    return state.products.filter((p) => (
      normalize(p.name).includes(term) || normalize(p.color).includes(term) ||
      normalize(p.size).includes(term) || normalize(p.description).includes(term)
    ));
  }

  function renderStats() {
    els.statCount.textContent = state.products.length;
    els.statUnits.textContent = state.products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  }

  function cartControlsTemplate(product) {
    const qty = cartQtyFor(product.id);
    const stock = Number(product.stock) || 0;
    if (stock <= 0 && qty === 0) {
      return `<button type="button" class="btn btn--ghost btn--sm tag-card__add-btn" disabled>Agotado</button>`;
    }
    if (qty === 0) {
      return `<button type="button" class="btn btn--primary btn--sm tag-card__add-btn" data-action="add-cart" data-id="${product.id}">Añadir al carrito</button>`;
    }
    return `
      <div class="tag-card__cart-row">
        <div class="qty-stepper">
          <button type="button" data-action="cart-minus" data-id="${product.id}" aria-label="Quitar una unidad">−</button>
          <span>${qty}</span>
          <button type="button" data-action="cart-plus" data-id="${product.id}" aria-label="Añadir una unidad">+</button>
        </div>
        <button type="button" class="cart-item__remove" data-action="cart-remove" data-id="${product.id}">Quitar</button>
      </div>
    `;
  }

  function cardTemplate(product) {
    const swatch = swatchFor(product.color);
    const stock = Number(product.stock) || 0;
    const priceBadge = stock <= 0
      ? `<span class="tag-card__stock tag-card__stock--out">Agotado</span>`
      : `<span class="tag-card__price">${formatBs(product.price)}</span>`;
    const adminButtons = state.isAdmin
      ? `<div class="tag-card__admin">
           <button type="button" class="tag-card__admin-btn" data-action="edit" data-id="${product.id}">Editar</button>
           <button type="button" class="tag-card__admin-btn tag-card__admin-btn--danger" data-action="delete" data-id="${product.id}">Eliminar</button>
         </div>`
      : "";

    return `
      <article class="tag-card" data-id="${product.id}">
        <img class="tag-card__image" src="${imageUrl(product)}" alt="${escapeHtml(product.name)}" loading="lazy" data-action="view" data-id="${product.id}">
        <span class="tag-card__perforation" aria-hidden="true"></span>
        <div class="tag-card__top" data-action="view" data-id="${product.id}">
          <h3 class="tag-card__name">${escapeHtml(product.name)}</h3>
          ${priceBadge}
        </div>
        <div class="tag-card__meta" data-action="view" data-id="${product.id}">
          <span class="chip">Talla ${escapeHtml(product.size)}</span>
          <span class="chip"><i class="chip__swatch" style="background:${swatch}"></i>${escapeHtml(product.color)}</span>
        </div>
        <p class="tag-card__desc" data-action="view" data-id="${product.id}">${escapeHtml(product.description)}</p>
        <div class="tag-card__cart">${cartControlsTemplate(product)}</div>
        ${adminButtons}
      </article>
    `;
  }

  function render() {
    const filtered = getFilteredProducts();
    els.catalogGrid.innerHTML = filtered.map(cardTemplate).join("");
    els.emptyState.hidden = filtered.length !== 0;
    renderStats();
  }

  /* -----------------------------------------------------------
     Render — puntos de venta
     ----------------------------------------------------------- */
  function renderPointsOfSale() {
    if (!els.posGrid) return;
    els.posGrid.innerHTML = POINTS_OF_SALE.map((pos) => {
      const url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(pos.mapsQuery);
      return `
        <article class="pos-card">
          <p class="pos-card__eyebrow">Punto de venta</p>
          <a class="pos-card__link" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(pos.name)}</a>
          <p class="pos-card__address">${escapeHtml(pos.address)}</p>
        </article>
      `;
    }).join("");
  }

  /* -----------------------------------------------------------
     Render — carrito
     ----------------------------------------------------------- */
  function renderCart() {
    if (!els.cartList) return;
    if (state.cart.length === 0) {
      els.cartList.innerHTML = "";
      els.cartEmptyState.hidden = false;
      els.cartSummary.hidden = true;
      return;
    }
    els.cartEmptyState.hidden = true;
    els.cartSummary.hidden = false;

    els.cartList.innerHTML = state.cart.map((item) => `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item__image" src="${item.image_url || PLACEHOLDER_IMAGE}" alt="${escapeHtml(item.name)}">
        <div class="cart-item__info">
          <p class="cart-item__name">${escapeHtml(item.name)}</p>
          <span class="cart-item__meta">Talla ${escapeHtml(item.size)} · ${escapeHtml(item.color)}</span>
        </div>
        <div class="qty-stepper">
          <button type="button" data-action="cart-minus" data-id="${item.id}" aria-label="Quitar una unidad">−</button>
          <span>${item.qty}</span>
          <button type="button" data-action="cart-plus" data-id="${item.id}" aria-label="Añadir una unidad">+</button>
        </div>
        <span class="cart-item__price">${formatBs(item.price * item.qty)}</span>
        <button type="button" class="cart-item__remove" data-action="cart-remove" data-id="${item.id}">Quitar</button>
      </div>
    `).join("");

    els.cartTotal.textContent = formatBs(cartTotalAmount());
  }

  /* -----------------------------------------------------------
     Vistas / navegación
     ----------------------------------------------------------- */
  function showView(viewName) {
    document.querySelectorAll(".view").forEach((v) => { v.hidden = true; });
    const target = document.getElementById("view-" + viewName);
    if (target) target.hidden = false;
    state.currentView = viewName;

    document.querySelectorAll(".drawer__link").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.view === viewName);
    });

    closeDrawer();

    if (viewName === "puntos-venta") renderPointsOfSale();
    if (viewName === "carrito") renderCart();
    if (viewName === "administracion") renderAdminView();
    if (viewName === "pedidos") loadOrders();

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function openDrawer() {
    els.drawer.hidden = false;
    els.drawerOverlay.hidden = false;
    els.drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    els.drawer.hidden = true;
    els.drawerOverlay.hidden = true;
    els.drawer.setAttribute("aria-hidden", "true");
  }

  els.menuBtn.addEventListener("click", openDrawer);
  els.drawerClose.addEventListener("click", closeDrawer);
  els.drawerOverlay.addEventListener("click", closeDrawer);

  document.querySelectorAll(".drawer__link[data-view]").forEach((link) => {
    link.addEventListener("click", () => showView(link.dataset.view));
  });

  els.cartShortcutBtn.addEventListener("click", () => showView("carrito"));

  /* -----------------------------------------------------------
     Modales genéricos
     ----------------------------------------------------------- */
  function closeModal(overlay) { overlay.hidden = true; }

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(document.getElementById(btn.dataset.close)));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });
  });

  /* -----------------------------------------------------------
     Administración — login / sesión
     ----------------------------------------------------------- */
  function updateAuthUI() {
    els.adminControls.hidden = !state.isAdmin;
    els.drawerPedidosLink.hidden = !state.isAdmin;
  }

  function renderAdminView() {
    if (state.isAdmin) {
      els.adminLoginBlock.hidden = true;
      els.adminSessionBlock.hidden = false;
    } else {
      els.adminLoginBlock.hidden = false;
      els.adminSessionBlock.hidden = true;
      els.loginForm.reset();
      els.loginError.hidden = true;
    }
  }

  els.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Credenciales inválidas.");

      sessionStorage.setItem("je_token", data.token);
      saveSession(true);
      updateAuthUI();
      renderAdminView();
      render();
      showToast("Bienvenido, administrador.");
    } catch (error) {
      els.loginError.textContent = error.message;
      els.loginError.hidden = false;
    }
  });

  els.logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("je_token");
    saveSession(false);
    updateAuthUI();
    renderAdminView();
    render();
    if (state.currentView === "pedidos") showView("catalogo");
    showToast("Sesión cerrada.");
  });

  /* -----------------------------------------------------------
     Alta / edición de producto
     ----------------------------------------------------------- */
  function openProductModal(product) {
    els.productForm.reset();
    els.productImageError.hidden = true;
    els.productImagePreview.hidden = true;
    els.productImagePreview.removeAttribute("src");
    els.productPriceError.hidden = true;

    if (product) {
      els.productModalEyebrow.textContent = "Editar ficha";
      els.productModalTitle.textContent = "Editar prenda";
      els.productSubmitBtn.textContent = "Guardar cambios";
      els.productImageLabel.textContent = "Imagen (deja vacío para conservar la actual)";
      els.productId.value = product.id;
      els.productName.value = product.name;
      els.productSize.value = product.size;
      els.productColor.value = product.color;
      els.productDescription.value = product.description;
      els.productPrice.value = product.price;
      els.productStock.value = product.stock;
      if (product.image_url) {
        els.productImagePreview.src = imageUrl(product);
        els.productImagePreview.hidden = false;
      }
    } else {
      els.productModalEyebrow.textContent = "Nueva ficha";
      els.productModalTitle.textContent = "Añadir prenda";
      els.productSubmitBtn.textContent = "Guardar prenda";
      els.productImageLabel.textContent = "Imagen (obligatoria)";
      els.productId.value = "";
    }
    els.productModalOverlay.hidden = false;
    els.productName.focus();
  }

  els.productImage.addEventListener("change", () => {
    const file = els.productImage.files[0];
    els.productImageError.hidden = true;
    if (!file) return;
    els.productImagePreview.src = URL.createObjectURL(file);
    els.productImagePreview.hidden = false;
  });

  els.addProductBtn.addEventListener("click", () => openProductModal(null));

  els.productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.isAdmin) return;

    const id = els.productId.value;
    const imageFile = els.productImage.files[0];

    if (!id && !imageFile) {
      els.productImageError.textContent = "Debes subir una imagen para la prenda.";
      els.productImageError.hidden = false;
      els.productImage.focus();
      return;
    }

    els.productPriceError.hidden = true;
    const priceValue = parsePriceInput(els.productPrice.value);
    if (priceValue === null) {
      els.productPriceError.textContent = "Ingresa un precio válido (ej. 150.00 o 150,00).";
      els.productPriceError.hidden = false;
      els.productPrice.focus();
      return;
    }

    const token = sessionStorage.getItem("je_token");
    const formData = new FormData();
    formData.append("name", els.productName.value.trim());
    formData.append("size", els.productSize.value.trim());
    formData.append("color", els.productColor.value.trim());
    formData.append("description", els.productDescription.value.trim());
    formData.append("price", String(priceValue));
    formData.append("stock", String(Math.max(0, Number(els.productStock.value) || 0)));
    if (imageFile) formData.append("image", imageFile);

    try {
      const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error al guardar");

      showToast(id ? "Prenda actualizada." : "Prenda añadida al catálogo.");
      closeModal(els.productModalOverlay);
      loadProducts();
    } catch (error) {
      showToast(error.message || "No se pudo completar la operación.");
    }
  });

  /* -----------------------------------------------------------
     Delegación de eventos — catálogo (ver / carrito / admin)
     ----------------------------------------------------------- */
  els.catalogGrid.addEventListener("click", async (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;
    const product = state.products.find((p) => p.id == id);

    if (action === "edit" || action === "delete") {
      e.stopPropagation();
      if (!product) return;
      if (action === "edit") {
        openProductModal(product);
      } else {
        if (window.confirm(`¿Eliminar "${product.name}"?`)) {
          try {
            const token = sessionStorage.getItem("je_token");
            await fetch(`${API_URL}/products/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });
            loadProducts();
            showToast("Prenda eliminada.");
          } catch (error) { showToast("Error al eliminar."); }
        }
      }
    } else if (action === "add-cart") {
      e.stopPropagation();
      if (product) addToCart(product);
    } else if (action === "cart-plus") {
      e.stopPropagation();
      if (product) addToCart(product);
    } else if (action === "cart-minus") {
      e.stopPropagation();
      decrementCart(id);
    } else if (action === "cart-remove") {
      e.stopPropagation();
      removeFromCart(id);
    } else if (action === "view") {
      if (!product) return;
      const stock = Number(product.stock) || 0;
      els.detailContent.innerHTML = `
        <img class="detail__image" src="${imageUrl(product)}" alt="${escapeHtml(product.name)}">
        <h2 class="detail__name">${escapeHtml(product.name)}</h2>
        <div class="detail__meta">
          <span class="chip">Talla ${escapeHtml(product.size)}</span>
          <span class="chip"><i class="chip__swatch" style="background:${swatchFor(product.color)}"></i>${escapeHtml(product.color)}</span>
        </div>
        <p class="detail__desc">${escapeHtml(product.description)}</p>
        <span class="detail__stock ${stock <= 0 ? "tag-card__stock--out" : "tag-card__stock--ok"}">${stock <= 0 ? "Agotado" : formatBs(product.price)}</span>
      `;
      els.detailModalOverlay.hidden = false;
    }
  });

  els.searchInput.addEventListener("input", (e) => { state.search = e.target.value; render(); });

  /* -----------------------------------------------------------
     Delegación de eventos — carrito
     ----------------------------------------------------------- */
  els.cartList.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const id = actionEl.dataset.id;
    const action = actionEl.dataset.action;
    if (action === "cart-plus") {
      const product = state.products.find((p) => p.id == id);
      if (product) addToCart(product);
    } else if (action === "cart-minus") {
      decrementCart(id);
    } else if (action === "cart-remove") {
      removeFromCart(id);
    }
  });

  els.cartOrderBtn.addEventListener("click", () => {
    if (state.cart.length === 0) return;
    showView("checkout");
  });

  /* -----------------------------------------------------------
     Checkout — formulario de pedido
     ----------------------------------------------------------- */
  function checkoutFieldsFilled() {
    return (
      els.checkoutName.value.trim() !== "" &&
      els.checkoutPhone.value.trim() !== "" &&
      els.checkoutEmail.value.trim() !== "" &&
      els.checkoutAddress.value.trim() !== ""
    );
  }

  function updateCheckoutSubmitState() {
    els.checkoutSubmitBtn.disabled = !checkoutFieldsFilled();
  }

  [els.checkoutName, els.checkoutPhone, els.checkoutEmail, els.checkoutAddress].forEach((input) => {
    input.addEventListener("input", updateCheckoutSubmitState);
  });

  els.checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!checkoutFieldsFilled() || state.cart.length === 0) return;

    els.checkoutError.hidden = true;
    els.checkoutSubmitBtn.disabled = true;
    els.checkoutSubmitBtn.textContent = "Enviando…";

    const payload = {
      full_name: els.checkoutName.value.trim(),
      phone: els.checkoutPhone.value.trim(),
      email: els.checkoutEmail.value.trim(),
      address: els.checkoutAddress.value.trim(),
      items: state.cart.map((c) => ({
        product_id: c.id, name: c.name, size: c.size, color: c.color,
        price: c.price, qty: c.qty,
      })),
      total: cartTotalAmount(),
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo enviar el pedido.");

      state.cart = [];
      saveCart();
      renderCartBadges();
      els.checkoutForm.reset();
      showToast("Pedido enviado. Nos pondremos en contacto contigo.");
      showView("catalogo");
    } catch (error) {
      els.checkoutError.textContent = error.message || "No se pudo enviar el pedido.";
      els.checkoutError.hidden = false;
    } finally {
      els.checkoutSubmitBtn.textContent = "Pedir";
      updateCheckoutSubmitState();
    }
  });

  /* -----------------------------------------------------------
     Pedidos (solo admin)
     ----------------------------------------------------------- */
  async function loadOrders() {
    if (!state.isAdmin) return;
    const token = sessionStorage.getItem("je_token");
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("No se pudieron cargar los pedidos.");
      state.orders = await response.json();
    } catch (error) {
      state.orders = [];
      showToast(error.message || "Error al cargar pedidos.");
    }
    renderOrders();
  }

  function renderOrders() {
    if (!els.ordersList) return;
    if (state.orders.length === 0) {
      els.ordersList.innerHTML = "";
      els.ordersEmptyState.hidden = false;
      return;
    }
    els.ordersEmptyState.hidden = true;
    els.ordersList.innerHTML = state.orders.map((order) => {
      let items = order.items;
      if (typeof items === "string") {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      items = Array.isArray(items) ? items : [];
      const date = order.created_at ? new Date(order.created_at).toLocaleString("es-BO") : "";
      const itemsHtml = items.map((it) => `
        <div class="order-card__item-row">
          <span>${escapeHtml(it.name)} · Talla ${escapeHtml(it.size || "")} · ${escapeHtml(it.color || "")} × ${it.qty}</span>
          <span>${formatBs(Number(it.price) * Number(it.qty))}</span>
        </div>
      `).join("");

      return `
        <article class="order-card">
          <div class="order-card__top">
            <span class="order-card__customer">${escapeHtml(order.full_name)}</span>
            <span class="order-card__date">${escapeHtml(date)}</span>
          </div>
          <p class="order-card__contact">
            ${escapeHtml(order.phone)} · ${escapeHtml(order.email)}<br>
            ${escapeHtml(order.address)}
          </p>
          <div class="order-card__items">${itemsHtml}</div>
          <div class="order-card__total"><span>Total</span><span>${formatBs(order.total)}</span></div>
        </article>
      `;
    }).join("");
  }

  /* -----------------------------------------------------------
     Init
     ----------------------------------------------------------- */
  async function init() {
    loadSession();
    loadCart();
    updateAuthUI();
    renderCartBadges();
    showWakeBanner();
    await Promise.all([pingServer(), loadProducts()]);
    hideWakeBanner();
    renderCart();
    showView("catalogo");
  }
  init();
})();