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
  return product && product.image_url
    ? product.image_url
    : PLACEHOLDER_IMAGE;
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

  const state = {
    products: [],
    isAdmin: false,
    search: "",
  };

  const els = {
    searchInput: document.getElementById("searchInput"),
    authArea: document.getElementById("authArea"),
    adminControls: document.getElementById("adminControls"),
    addProductBtn: document.getElementById("addProductBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    catalogGrid: document.getElementById("catalogGrid"),
    emptyState: document.getElementById("emptyState"),
    statCount: document.getElementById("statCount"),
    statUnits: document.getElementById("statUnits"),
    wakeBanner: document.getElementById("wakeBanner"),

    loginModalOverlay: document.getElementById("loginModalOverlay"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),

    productModalOverlay: document.getElementById("productModalOverlay"),
    productModalTitle: document.getElementById("productModalTitle"),
    productModalEyebrow: document.getElementById("productModalEyebrow"),
    productForm: document.getElementById("productForm"),
    productId: document.getElementById("productId"),
    productName: document.getElementById("productName"),
    productSize: document.getElementById("productSize"),
    productColor: document.getElementById("productColor"),
    productDescription: document.getElementById("productDescription"),
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

  let toastTimer = null;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }

  function stockTier(stock) {
    if (stock <= 0) return { cls: "out", label: "Agotado" };
    if (stock <= 5) return { cls: "low", label: `${stock} uds` };
    return { cls: "ok", label: `${stock} uds` };
  }

  /* -----------------------------------------------------------
     Reactivación del servidor (Render)
     ----------------------------------------------------------- */
  function showWakeBanner() {
    if (els.wakeBanner) els.wakeBanner.hidden = false;
  }

  function hideWakeBanner() {
    if (els.wakeBanner) els.wakeBanner.hidden = true;
  }

  // Ping liviano que no consulta la base de datos: su único fin es
  // despertar el servidor de Render en cuanto carga la página, para
  // que esté listo antes de que el usuario intente iniciar sesión.
  async function pingServer() {
    try {
      await fetch(`${SERVER_ORIGIN}/api/health`, { cache: "no-store" });
    } catch (e) {
      // Silencioso: si el ping falla, loadProducts() igual intentará conectar.
    }
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

  function saveSession(isAdmin) {
    state.isAdmin = isAdmin;
  }

  /* -----------------------------------------------------------
     Render
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

  function cardTemplate(product) {
    const tier = stockTier(Number(product.stock) || 0);
    const swatch = swatchFor(product.color);
    const adminButtons = state.isAdmin
      ? `<div class="tag-card__admin">
           <button type="button" class="tag-card__admin-btn" data-action="edit" data-id="${product.id}">Editar</button>
           <button type="button" class="tag-card__admin-btn tag-card__admin-btn--danger" data-action="delete" data-id="${product.id}">Eliminar</button>
         </div>`
      : "";

    return `
      <article class="tag-card" data-id="${product.id}" data-action="view">
        <img class="tag-card__image" src="${imageUrl(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
        <span class="tag-card__perforation" aria-hidden="true"></span>
        <div class="tag-card__top">
          <h3 class="tag-card__name">${escapeHtml(product.name)}</h3>
          <span class="tag-card__stock tag-card__stock--${tier.cls}">${tier.label}</span>
        </div>
        <div class="tag-card__meta">
          <span class="chip">Talla ${escapeHtml(product.size)}</span>
          <span class="chip"><i class="chip__swatch" style="background:${swatch}"></i>${escapeHtml(product.color)}</span>
        </div>
        <p class="tag-card__desc">${escapeHtml(product.description)}</p>
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

  function openLoginModal() {
    els.loginForm.reset();
    els.loginError.hidden = true;
    els.loginModalOverlay.hidden = false;
    els.loginUsername.focus();
  }

  function updateAuthUI() {
    if (state.isAdmin) {
      els.authArea.innerHTML = `<span class="auth-area__hello">Sesión: administrador</span>`;
      els.adminControls.hidden = false;
    } else {
      els.authArea.innerHTML = `<button type="button" class="btn btn--outline btn--icon-square" id="loginBtn" aria-label="Iniciar sesión" title="Iniciar sesión">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.7"/>
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
      </button>`;
      els.adminControls.hidden = true;
      // Reasignamos el evento al botón recién creado dinámicamente
      document.getElementById("loginBtn").addEventListener("click", openLoginModal);
    }
  }

  function closeModal(overlay) { overlay.hidden = true; }

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(document.getElementById(btn.dataset.close)));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });
  });

  /* -----------------------------------------------------------
     Login
     ----------------------------------------------------------- */
  // Conectamos el botón inicial del HTML estático
  document.getElementById("loginBtn").addEventListener("click", openLoginModal);

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

      if (!response.ok) {
        throw new Error(data.error || "Credenciales inválidas.");
      }

      sessionStorage.setItem("je_token", data.token);
      saveSession(true);
      closeModal(els.loginModalOverlay);
      updateAuthUI();
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
    render();
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
      els.productSize.value = "M";
    }
    els.productModalOverlay.hidden = false;
    els.productName.focus();
  }

  // Vista previa instantánea al elegir un archivo nuevo.
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

    // Al crear una prenda nueva, la imagen es obligatoria.
    if (!id && !imageFile) {
      els.productImageError.textContent = "Debes subir una imagen para la prenda.";
      els.productImageError.hidden = false;
      els.productImage.focus();
      return;
    }

    const token = sessionStorage.getItem("je_token");
    const formData = new FormData();
    formData.append("name", els.productName.value.trim());
    formData.append("size", els.productSize.value);
    formData.append("color", els.productColor.value.trim());
    formData.append("description", els.productDescription.value.trim());
    formData.append("stock", String(Math.max(0, Number(els.productStock.value) || 0)));
    if (imageFile) formData.append("image", imageFile);

    try {
      const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
      const method = id ? "PUT" : "POST";
      // Ojo: NO se fija "Content-Type" a mano — el navegador arma el
      // boundary de multipart/form-data automáticamente.
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
     Delegación de eventos
     ----------------------------------------------------------- */
  els.catalogGrid.addEventListener("click", async (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === "edit" || action === "delete") {
      e.stopPropagation();
      const id = actionEl.dataset.id;
      const product = state.products.find((p) => p.id == id);
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
    } else if (action === "view") {
      const card = e.target.closest(".tag-card");
      const product = state.products.find((p) => p.id == card.dataset.id);
      if (product) {
        const tier = stockTier(Number(product.stock) || 0);
        els.detailContent.innerHTML = `
          <img class="detail__image" src="${imageUrl(product)}" alt="${escapeHtml(product.name)}">
          <h2 class="detail__name">${escapeHtml(product.name)}</h2>
          <p>${escapeHtml(product.description)}</p>
          <span class="detail__stock tag-card__stock--${tier.cls}">${tier.label}</span>
        `;
        els.detailModalOverlay.hidden = false;
      }
    }
  });

  els.searchInput.addEventListener("input", (e) => { state.search = e.target.value; render(); });

  async function init() {
    loadSession();
    updateAuthUI();
    showWakeBanner();
    await Promise.all([pingServer(), loadProducts()]);
    hideWakeBanner();
  }
  init();
})();