document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DEL MENÚ MÓVIL (NUEVO) ---
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('overlay');

    if (menuToggle && mobileMenu && overlay) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
        });
    }

    const closeMenu = () => {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
    };

    if (menuClose && mobileMenu && overlay) {
        menuClose.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);
    }
    
    // Cierra el menú móvil si se hace clic en un enlace
    if (mobileMenu) {
        mobileMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }


    // --- 2. CONFIGURACIÓN E INICIALIZACIÓN ---
    const articlesContainer = document.getElementById('articles-container');
    
    // Si no estamos en index.html, detenemos el script
    if (!articlesContainer) {
        return; 
    }

    // --- ¡IMPORTANTE! Reemplaza esto si tu API está en otro lugar ---
    const API_URL = 'https://lfaftechapi.onrender.com'; 
    const SITIO = 'noticias.lat';
    const LIMITE_POR_PAGINA = 12;
    const PLACEHOLDER_IMG = 'images/placeholder.jpg'; // Imagen de respaldo

    const loadingMessage = document.getElementById('loading-message');
    const categoryTitle = document.getElementById('category-title');
    const paginationContainer = document.getElementById('pagination-container');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const clearSearchButton = document.getElementById('clear-search-button');

    // --- ¡MAPA COMPLETO DE 19 PAÍSES! ---
    const BANDERAS = {
        ar: '🇦🇷 Argentina', bo: '🇧🇴 Bolivia', br: '🇧🇷 Brasil',
        cl: '🇨🇱 Chile', co: '🇨🇴 Colombia', cr: '🇨🇷 Costa Rica',
        cu: '🇨🇺 Cuba', ec: '🇪🇨 Ecuador', sv: '🇸🇻 El Salvador',
        gt: '🇬🇹 Guatemala', hn: '🇭🇳 Honduras', mx: '🇲🇽 México',
        ni: '🇳🇮 Nicaragua', pa: '🇵🇦 Panamá', py: '🇵🇾 Paraguay',
        pe: '🇵🇪 Perú', do: '🇩🇴 Rep. Dominicana', uy: '🇺🇾 Uruguay',
        ve: '🇻🇪 Venezuela'
    };
    
    // --- ¡MAPA DE 8 CATEGORÍAS! ---
    const CATEGORIAS_TITULOS = {
        todos: 'Última Hora (General)',
        politica: 'Política',
        economia: 'Economía',
        deportes: 'Deportes',
        tecnologia: 'Tecnología',
        entretenimiento: 'Show y Entretenimiento',
        salud: 'Salud',
        internacional: 'Mundo'
    };


    // --- 3. FUNCIONES DE UTILERÍA Y MANEJO DE ESTADO ---
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('query') || null; 
        const pais = query ? null : (params.get('pais') || null);
        // Si hay 'query' o 'pais', 'categoria' se ignora (todos)
        const categoria = (query || pais) ? 'todos' : (params.get('categoria') || 'todos');
        const pagina = parseInt(params.get('pagina')) || 1;
        
        return { query, pais, categoria, pagina };
    }

    function updateActiveCategory(query, categoria, pais) {
        let titulo = CATEGORIAS_TITULOS['todos']; 
        
        if (query) {
            titulo = `Resultados de búsqueda: "${query}"`;
            if (searchInput) searchInput.value = query;
            if (clearSearchButton) clearSearchButton.style.display = 'inline-block';
        } else {
            if (clearSearchButton) clearSearchButton.style.display = 'none';
            if (searchInput) searchInput.value = '';

            let activeKey = pais || categoria;
            
            // Título para País
            if (pais && BANDERAS[pais]) {
                titulo = `Noticias de ${BANDERAS[pais]}`;
            } 
            // Título para Categoría
            else if (categoria && CATEGORIAS_TITULOS[categoria]) {
                titulo = CATEGORIAS_TITULOS[categoria];
            }

            // Marcar el enlace activo
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.categoria === activeKey || link.dataset.pais === activeKey) {
                    link.classList.add('active');
                }
            });
        }
        
        if (categoryTitle) categoryTitle.textContent = titulo;
    }

    function buildPagination(paginaActual, totalPaginas, categoria, pais, query) {
        if (paginationContainer) paginationContainer.innerHTML = ''; 
        if (totalPaginas <= 1 || !paginationContainer) return;

        let queryString = '';
        if (query) {
            queryString = `query=${encodeURIComponent(query)}`;
        } else if (pais) {
            queryString = `pais=${pais}`;
        } else {
            queryString = `categoria=${categoria}`;
        }
        
        // Botón "Anterior"
        if (paginaActual > 1) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${paginaActual - 1}" class="page-link" aria-label="Anterior">Anterior</a>`;
        } else {
            paginationContainer.innerHTML += `<span class="page-link disabled" aria-disabled="true">Anterior</span>`;
        }

        // --- Lógica de "..." ---
        let startPage = Math.max(1, paginaActual - 2);
        let endPage = Math.min(totalPaginas, paginaActual + 2);

        if (paginaActual <= 3) {
            endPage = Math.min(totalPaginas, 5);
        }
        if (paginaActual > totalPaginas - 3) {
            startPage = Math.max(1, totalPaginas - 4);
        }

        if (startPage > 1) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=1" class="page-link">1</a>`;
            if (startPage > 2) {
                paginationContainer.innerHTML += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${i}" class="page-link ${i === paginaActual ? 'active' : ''}">${i}</a>`;
        }

        if (endPage < totalPaginas) {
            if (endPage < totalPaginas - 1) {
                paginationContainer.innerHTML += `<span class="page-ellipsis">...</span>`;
            }
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${totalPaginas}" class="page-link">${totalPaginas}</a>`;
        }
        // --- Fin Lógica "..." ---

        // Botón "Siguiente"
        if (paginaActual < totalPaginas) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${paginaActual + 1}" class="page-link" aria-label="Siguiente">Siguiente</a>`;
        } else {
            paginationContainer.innerHTML += `<span class="page-link disabled" aria-disabled="true">Siguiente</span>`;
        }
    }

    // --- 4. FUNCIÓN PRINCIPAL DE CARGA ---
    async function fetchNews() {
        const { query, categoria, pais, pagina } = getUrlParams();
        updateActiveCategory(query, categoria, pais);

        if (articlesContainer) articlesContainer.innerHTML = '';
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (paginationContainer) paginationContainer.innerHTML = ''; 

        try {
            let url = `${API_URL}/api/articles?sitio=${SITIO}&limite=${LIMITE_POR_PAGINA}&pagina=${pagina}`;
            
            if (query) {
                url += `&query=${encodeURIComponent(query)}`;
            } else if (pais) {
                url += `&pais=${pais}`;
            } else if (categoria !== 'todos') { // Solo añade categoría si NO es 'todos'
                url += `&categoria=${categoria}`;
            }
            // Si es 'todos' (y no hay query ni pais), no añade filtro, trayendo todo.

            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);

            const data = await response.json();
            const articles = data.articulos;

            if (loadingMessage) loadingMessage.style.display = 'none';

            if (!articlesContainer) return; // Doble chequeo

            if (articles.length === 0) {
                const message = query 
                    ? `No se encontraron resultados para "${query}".`
                    : 'No se encontraron noticias en esta sección.';
                articlesContainer.innerHTML = `<p class="no-articles-message">${message}</p>`;
            } else {
                
                articles.forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'article-card';

                    // --- LÓGICA DE BANDERA Y FUENTE ---
                    let infoFuente = `<span>Fuente: ${article.fuente}</span>`;
                    let flagHTML = '';
                    if (article.pais && BANDERAS[article.pais]) {
                        const bandera = BANDERAS[article.pais].split(' ')[0]; 
                        infoFuente = `<span>${bandera} ${article.fuente}</span>`;
                        flagHTML = `<span class="article-card-flag">${bandera}</span>`;
                    }
                    
                    // --- LÓGICA DE DESCRIPCIÓN (Ocultar si no existe) ---
                    let descripcionHTML = '';
                    if (article.descripcion && article.descripcion !== 'Sin descripción.') {
                        descripcionHTML = `<p>${article.descripcion.substring(0, 120)}...</p>`;
                    }
                    
                    // --- LÓGICA DE IMAGEN (Placeholder) ---
                    const imagenUrl = article.imagen || PLACEHOLDER_IMG;
                    
                    card.innerHTML = `
                        <a href="articulo.html?id=${article._id}" class="article-card-image-link">
                            <img src="${imagenUrl}" alt="${article.titulo}" loading="lazy" 
                                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">
                            ${flagHTML}
                        </a>
                        <div class="article-card-content">
                            <h3>
                                <a href="articulo.html?id=${article._id}">${article.titulo}</a>
                            </h3>
                            ${descripcionHTML}
                            <div class="article-card-footer">
                                ${infoFuente}
                                <span>${formatDate(article.fecha)}</span>
                            </div>
                        </div>
                    `;
                    articlesContainer.appendChild(card);
                });

                buildPagination(data.paginaActual, data.totalPaginas, categoria, pais, query);
            }

        } catch (error) {
            console.error('Error al cargar las noticias:', error);
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (articlesContainer) articlesContainer.innerHTML = '<p class="no-articles-message" style="color: red;">Error al cargar las noticias. Intente recargar la página.</p>';
        }
    }
    
    // --- 5. EVENT LISTENERS PARA BÚSQUEDA ---
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                // Redirige a la página de búsqueda
                window.location.href = `index.html?query=${encodeURIComponent(query)}`;
            }
        });
    }

    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            // Limpia la búsqueda y vuelve a 'General'
            window.location.href = 'index.html?categoria=todos'; 
        });
    }

    // --- INICIAR LA CARGA ---
    fetchNews();
});