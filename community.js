/* =========================================================
   MYTOOLX COMMUNITY CLIENT LOGIC (community.js) - V2
   Supports Pagination, Sorting, Searching, and Clickable Stars
========================================================= */

// IMPORTANT: PUT YOUR GOOGLE APPS SCRIPT URL HERE (Keep the quotes!)
const API_URL = "https://script.google.com/macros/s/AKfycbxMZGHXUkzX04Z3slFH5F3GveBOIrj-XiKPl04aPOTHjBur8uSg57kb-PRr781vcStd5w/exec"; 

let currentState = {
    page: 1,
    limit: 12,
    filter: "all",
    sort: "newest",
    search: "",
    totalPages: 1
};

// Global Language Dictionary (Detects language from the HTML tag)
const LANG = document.documentElement.lang || "en";
const UI_STRINGS = {
    en: {
        anonymous: "Anonymous",
        verified: "Verified",
        helpful: "Helpful",
        visit: "Visit Page →",
        open: "Open →",
        noReviews: "No approved submissions in this category yet.",
        loading: "Loading...",
        loadMore: "Load More Reviews",
        error: "Unable to load community data.",
        stars: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"]
    },
    es: {
        anonymous: "Anónimo",
        verified: "Verificado",
        helpful: "Útil",
        visit: "Visitar página →",
        open: "Abrir →",
        noReviews: "Aún no hay aportaciones aprobadas en esta categoría.",
        loading: "Cargando...",
        loadMore: "Cargar más opiniones",
        error: "No se pudieron cargar los datos.",
        stars: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"]
    },
    fr: {
        anonymous: "Anonyme",
        verified: "Vérifié",
        helpful: "Utile",
        visit: "Visiter la page →",
        open: "Ouvrir →",
        noReviews: "Aucune contribution approuvée dans cette catégorie.",
        loading: "Chargement...",
        loadMore: "Charger plus d'avis",
        error: "Impossible de charger les données.",
        stars: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"]
    }
};
const T = UI_STRINGS[LANG] || UI_STRINGS['en'];

document.addEventListener("DOMContentLoaded", function () {
    fetchStats();
    fetchReviews();
    fetchTopFeatures();
    setupStarRating();
    setupSearch();
});

// --- FETCHING DATA ---
async function fetchStats() {
    try {
        const res = await fetch(API_URL + "?action=getStats");
        const json = await res.json();
        if (json.status === "success") {
            document.getElementById("statTotalReviews").textContent = json.stats.totalReviews;
            document.getElementById("statAvgRating").textContent = json.stats.avgRating + " ⭐";
            document.getElementById("statTotalSuggestions").textContent = json.stats.totalSuggestions;
            document.getElementById("statReviewedTools").textContent = json.stats.toolsRated;
            
            // Render Distribution Bars (if the HTML elements exist)
            if (json.stats.distribution) {
                for (let i = 1; i <= 5; i++) {
                    const bar = document.getElementById("distBar" + i);
                    const pct = document.getElementById("distPct" + i);
                    if (bar && pct) {
                        bar.style.width = json.stats.distribution[i] + "%";
                        pct.textContent = json.stats.distribution[i] + "%";
                    }
                }
            }
        }
    } catch (e) {
        console.error("Stats error", e);
    }
}

async function fetchReviews(append = false) {
    const grid = document.getElementById("reviewsGrid");
    const loading = document.getElementById("loadingState");
    const empty = document.getElementById("emptyState");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    if (!append) {
        grid.innerHTML = "";
        loading.classList.remove("hidden");
        empty.classList.add("hidden");
        if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
        currentState.page = 1;
    }

    try {
        const url = `${API_URL}?action=getApproved&page=${currentState.page}&limit=${currentState.limit}&filter=${currentState.filter}&sort=${currentState.sort}&search=${encodeURIComponent(currentState.search)}&lang=${LANG}`;
        const res = await fetch(url);
        const json = await res.json();

        loading.classList.add("hidden");

        if (json.status === "success" && json.data.length > 0) {
            currentState.totalPages = json.totalPages;
            grid.insertAdjacentHTML('beforeend', json.data.map(item => buildReviewCard(item)).join(""));
            
            // Show Load More button if there are more pages
            if (loadMoreBtn) {
                if (currentState.page < currentState.totalPages) {
                    loadMoreBtn.classList.remove("hidden");
                } else {
                    loadMoreBtn.classList.add("hidden");
                }
            }
        } else if (!append) {
            empty.classList.remove("hidden");
            empty.querySelector("p").textContent = T.noReviews;
        }
    } catch (e) {
        loading.classList.add("hidden");
        grid.innerHTML = `<div class="text-red-500 font-bold p-4">${T.error}</div>`;
    }
}

async function fetchTopFeatures() {
    const grid = document.getElementById("topFeaturesGrid");
    try {
        const res = await fetch(API_URL + "?action=getTopFeatures");
        const json = await res.json();
        
        if (json.status === "success" && json.data.length > 0) {
            grid.innerHTML = json.data.map(feat => `
                <div class="surface p-4 rounded-2xl flex items-center justify-between shadow-sm gap-3">
                    <div class="min-w-0">
                        <div class="font-bold text-sm truncate" style="color: var(--text);">${feat.name}</div>
                        <div class="text-xs muted">${feat.count} ${LANG === 'es' ? 'opiniones' : LANG === 'fr' ? 'avis' : 'reviews'}</div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="text-sm font-black text-amber-500">${feat.avg} ⭐</div>
                        ${feat.url ? `<a href="${feat.url}" class="text-[11px] font-bold hover:underline" style="color: var(--primary);">${T.open}</a>` : ''}
                    </div>
                </div>
            `).join("");
        } else {
            grid.innerHTML = `<div class="muted text-xs">${LANG === 'es' ? 'Aún no hay suficientes opiniones.' : LANG === 'fr' ? 'Pas encore assez d\'avis.' : 'Not enough reviews yet.'}</div>`;
        }
    } catch (e) {
        console.error("Top features error", e);
    }
}

// --- UI BUILDERS ---
function buildReviewCard(item) {
    const isSuggestion = item.formType === "suggestion";
    const stars = isSuggestion ? "💡" : "⭐".repeat(Number(item.starRating) || 5);
    const dateStr = new Date(item.timestamp).toLocaleDateString(LANG, { month: "short", day: "numeric", year: "numeric" });
    const author = item.authorName || T.anonymous;
    const country = item.country ? ` • ${item.country}` : "";
    const badge = `<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">✓ ${T.verified}</span>`;

    return `
        <div class="surface p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div class="flex items-center justify-between mb-3 gap-2">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-md truncate" style="background: var(--chip-bg); color: var(--primary);">
                        ${item.pageName || item.suggestionCategory || 'MyToolX'}
                    </span>
                    <span class="text-xs font-bold text-amber-500 whitespace-nowrap">${stars}</span>
                </div>
                
                ${isSuggestion ? `<h4 class="font-bold text-sm mb-1" style="color: var(--text);">${escapeHtml(item.suggestionTitle || '')}</h4>` : ''}
                <p class="text-xs sm:text-sm muted leading-relaxed mb-4">"${escapeHtml(item.commentText || '')}"</p>
            </div>
            
            <div class="pt-3 border-t flex items-center justify-between text-[11px] muted" style="border-color: var(--card-border);">
                <div class="flex flex-col gap-0.5">
                    <span class="font-bold" style="color: var(--text);">${escapeHtml(author)}${country}</span>
                    <span>📅 ${dateStr} ${!isSuggestion ? badge : ''}</span>
                </div>
                ${item.pageUrl && !isSuggestion ? `<a href="${item.pageUrl}" class="font-bold hover:underline" style="color: var(--primary);">${T.visit}</a>` : ''}
            </div>
        </div>
    `;
}

// --- CONTROLS ---
function filterCategory(category, btnElement) {
    document.querySelectorAll("#filterButtons button").forEach(btn => {
        btn.className = "btn-3d btn-chip px-3.5 sm:px-4 py-2 rounded-full";
    });
    if (btnElement) btnElement.className = "btn-3d btn-primary px-3.5 sm:px-4 py-2 rounded-full";
    
    currentState.filter = category;
    fetchReviews();
}

function sortReviews(sortValue) {
    currentState.sort = sortValue;
    fetchReviews();
}

function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    
    let timeout = null;
    searchInput.addEventListener("input", function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentState.search = e.target.value;
            fetchReviews();
        }, 500); // Wait 500ms after user stops typing
    });
}

function loadMoreReviews() {
    currentState.page++;
    fetchReviews(true);
}

// --- CLICKABLE STARS LOGIC ---
function setupStarRating() {
    const container = document.getElementById("starRatingContainer");
    const input = document.getElementById("starRating");
    if (!container || !input) return;

    const stars = container.querySelectorAll(".star-click");
    let currentRating = 5;

    function updateStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add("text-amber-500");
                star.classList.remove("text-gray-300", "dark:text-gray-600");
            } else {
                star.classList.remove("text-amber-500");
                star.classList.add("text-gray-300", "dark:text-gray-600");
            }
        });
    }

    stars.forEach((star, index) => {
        // Hover effect
        star.addEventListener("mouseenter", () => updateStars(index + 1));
        
        // Reset to selected on mouse leave
        star.addEventListener("mouseleave", () => updateStars(currentRating));
        
        // Click to select
        star.addEventListener("click", () => {
            currentRating = index + 1;
            input.value = currentRating;
            updateStars(currentRating);
        });
        
        // Touch support
        star.addEventListener("touchstart", (e) => {
            e.preventDefault();
            currentRating = index + 1;
            input.value = currentRating;
            updateStars(currentRating);
        });
    });

    // Initialize
    updateStars(currentRating);
}

// --- FORM SUBMISSION ---
async function submitCommunityFeedback(event) {
    event.preventDefault();
    const errorBox = document.getElementById("formError");
    const successBox = document.getElementById("formSuccess");
    const submitBtn = document.getElementById("submitModalBtn");

    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");

    const formType = document.getElementById("formType").value;
    const commentText = document.getElementById("commentText").value.trim();
    const authorName = document.getElementById("authorName") ? document.getElementById("authorName").value.trim() : "";
    const country = document.getElementById("country") ? document.getElementById("country").value.trim() : "";

    let payload = {
        formType: formType,
        commentText: commentText,
        authorName: authorName,
        country: country,
        recommendation: "Yes",
        language: LANG
    };

    if (formType === "suggestion") {
        payload.suggestionCategory = document.getElementById("suggestionCategory").value;
        payload.suggestionTitle = document.getElementById("suggestionTitle").value.trim();
        if (!payload.suggestionTitle || !commentText) {
            showError(errorBox, LANG === 'es' ? "Por favor, completa todos los campos." : LANG === 'fr' ? "Veuillez remplir tous les champs." : "Please fill out all required suggestion fields.");
            return;
        }
    } else {
        const pageSelect = document.getElementById("targetPageId");
        payload.targetPageId = pageSelect.value;
        payload.starRating = document.getElementById("starRating").value;
        payload.pageUrl = pageSelect.value + ".html";
        if (!commentText) {
            showError(errorBox, LANG === 'es' ? "Por favor, escribe tu opinión." : LANG === 'fr' ? "Veuillez écrire votre avis." : "Please enter your written review.");
            return;
        }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "⏳...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.status === "success") {
            successBox.textContent = LANG === 'es' ? "🎉 ¡Gracias! Tu opinión está pendiente de moderación." : LANG === 'fr' ? "🎉 Merci ! Votre avis est en attente de modération." : "🎉 Thank you! Your submission is pending moderation.";
            successBox.classList.remove("hidden");
            document.getElementById("communityForm").reset();
            if (document.getElementById("starRatingContainer")) setupStarRating(); // Reset stars
            setTimeout(() => { 
                closeFeedbackModal(); 
                submitBtn.disabled = false; 
                submitBtn.textContent = "🚀 Submit Feedback"; 
            }, 3000);
        } else {
            showError(errorBox, result.message || "Submission failed.");
            submitBtn.disabled = false;
            submitBtn.textContent = "🚀 Submit Feedback";
        }
    } catch (err) {
        showError(errorBox, "Network error. Please try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 Submit Feedback";
    }
}

function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
}

// --- MODAL CONTROLS ---
function openFeedbackModal(type = "review") {
    document.getElementById("formType").value = type;
    toggleFormFields();
    document.getElementById("feedbackModal").classList.remove("hidden");
}

function closeFeedbackModal() {
    document.getElementById("feedbackModal").classList.add("hidden");
    document.getElementById("communityForm").reset();
    document.getElementById("formError").classList.add("hidden");
    document.getElementById("formSuccess").classList.add("hidden");
}

function toggleFormFields() {
    const type = document.getElementById("formType").value;
    const targetPageGroup = document.getElementById("targetPageGroup");
    const suggestionCategoryGroup = document.getElementById("suggestionCategoryGroup");
    const ratingGroup = document.getElementById("ratingGroup");
    const titleGroup = document.getElementById("titleGroup");
    const commentLabel = document.getElementById("commentLabel");
    const modalTitle = document.getElementById("modalTitle");

    if (type === "suggestion") {
        targetPageGroup.classList.add("hidden");
        suggestionCategoryGroup.classList.remove("hidden");
        ratingGroup.classList.add("hidden");
        titleGroup.classList.remove("hidden");
        commentLabel.textContent = LANG === 'es' ? "Descripción detallada *" : LANG === 'fr' ? "Description détaillée *" : "Detailed Suggestion Description *";
        modalTitle.textContent = LANG === 'es' ? "Sugerir una nueva función" : LANG === 'fr' ? "Suggérer une nouvelle fonctionnalité" : "Suggest a New Tool or Feature";
    } else {
        targetPageGroup.classList.remove("hidden");
        suggestionCategoryGroup.classList.add("hidden");
        ratingGroup.classList.remove("hidden");
        titleGroup.classList.add("hidden");
        commentLabel.textContent = LANG === 'es' ? "Comentario escrito *" : LANG === 'fr' ? "Commentaire écrit *" : "Written Comment *";
        modalTitle.textContent = LANG === 'es' ? "Comparte tu opinión" : LANG === 'fr' ? "Partagez votre avis" : "Share Your Feedback";
    }
}

function handleBackdropClick(e) {
    if (e.target && e.target.id === 'feedbackModal') closeFeedbackModal();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('feedbackModal');
        if (modal && !modal.classList.contains('hidden')) closeFeedbackModal();
    }
});

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// --- AUTO-OPEN MODAL FROM URL PARAMETERS ---
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('tool');
    
    if (toolId) {
        // Open the modal in review mode
        openFeedbackModal('review');
        
        // Pre-select the tool in the dropdown
        const pageSelect = document.getElementById("targetPageId");
        if (pageSelect) {
            pageSelect.value = toolId;
        }
        
        // Hide ONLY the dropdown, but keep the stars visible
        const dropdownContainer = document.getElementById("targetPageId").parentElement;
        if (dropdownContainer) {
            dropdownContainer.style.display = 'none'; 
        }
        
        // Make the stars take up the full width now that the dropdown is gone
        const ratingContainer = document.getElementById("ratingGroup");
        if (ratingContainer) {
            ratingContainer.className = "col-span-1 sm:col-span-2";
        }
    }
});