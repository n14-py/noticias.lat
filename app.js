document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DEL MENÚ MÓVIL (Sin cambios, ya era funcional) ---
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }
    if (menuClose && mobileMenu) {
        menuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    // --- 2. CONFIGURACIÓN E INICIALIZACIÓN ---
    const articlesContainer = document.getElementById('articles-container');
    
    if (!articlesContainer) {
        return; 
    }

    const API_URL = 'https://lfaftechapi.onrender.com'; 
    const SITIO = 'noticias.lat';
    const LIMITE_POR_PAGINA = 12;

    const loadingMessage = document.getElementById('loading-message');
    const categoryTitle = document.getElementById('category-title');
    const paginationContainer = document.getElementById('pagination-container');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Elementos de Búsqueda
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const clearSearchButton = document.getElementById('clear-search-button');

    // Mapeo de códigos de país a banderas para la visualización
    const BANDERAS = {
        ar: '🇦🇷 Argentina', mx: '🇲🇽 México', co: '🇨🇴 Colombia',
        cl: '🇨🇱 Chile', pe: '🇵🇪 Perú', py: '🇵🇾 Paraguay'
    };


    // --- 3. FUNCIONES DE UTILERÍA Y MANEJO DE ESTADO ---
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        // ¡NUEVO! Capturamos el término de búsqueda
        const query = params.get('query') || null; 
        
        // Si hay búsqueda, ignoramos la categoría/país para no tener conflictos en la API
        const pais = query ? null : (params.get('pais') || null);
        const categoria = query ? 'todos' : (params.get('categoria') || 'todos');
        const pagina = parseInt(params.get('pagina')) || 1;
        
        return { query, pais, categoria, pagina };
    }

    function updateActiveCategory(query, categoria, pais) {
        let titulo = "Última Hora (General)"; 
        
        if (query) {
            titulo = `Resultados de búsqueda para: "${query}"`;
            searchInput.value = query; // Rellenar el input
            clearSearchButton.style.display = 'inline-block'; // Mostrar botón de limpiar
        } else {
            clearSearchButton.style.display = 'none';
            searchInput.value = '';

            let activeKey = pais || categoria;
            
            if (pais) {
                titulo = `Noticias de ${BANDERAS[pais]}`;
            } else {
                if (categoria === 'deportes') titulo = "Deportes";
                if (categoria === 'tecnologia') titulo = "Tecnología";
                if (categoria === 'entretenimiento') titulo = "Show y Entretenimiento";
            }

            // Activar enlace de navegación
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.categoria === activeKey || link.dataset.pais === activeKey) {
                    link.classList.add('active');
                }
            });
        }
        
        categoryTitle.textContent = titulo;
    }

    function buildPagination(paginaActual, totalPaginas, categoria, pais, query) {
        paginationContainer.innerHTML = ''; 
        if (totalPaginas <= 1) return;

        // Si hay búsqueda, el query string es solo el query. Si no, es categoría o país.
        let queryString = query ? `query=${query}` : (pais ? `pais=${pais}` : `categoria=${categoria}`);
        
        // Lógica de 7 botones (implementada en el paso anterior)
        let startPage = Math.max(1, paginaActual - 3);
        let endPage = Math.min(totalPaginas, paginaActual + 3);

        if (paginaActual <= 4) endPage = Math.min(totalPaginas, 7);
        if (paginaActual > totalPaginas - 3) startPage = Math.max(1, totalPaginas - 6);

        // Botón Anterior
        if (paginaActual > 1) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${paginaActual - 1}" class="page-link">Anterior</a>`;
        }
        
        // Elipses y botón 1
        if (startPage > 1) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=1" class="page-link">1</a>`;
            if (startPage > 2) paginationContainer.innerHTML += `<span class="page-link" style="border:none;">...</span>`;
        }

        // Números centrales
        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${i}" class="page-link ${i === paginaActual ? 'active' : ''}">${i}</a>`;
        }

        // Elipses y botón final
        if (endPage < totalPaginas) {
            if (endPage < totalPaginas - 1) paginationContainer.innerHTML += `<span class="page-link" style="border:none;">...</span>`;
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${totalPaginas}" class="page-link">${totalPaginas}</a>`;
        }

        // Botón Siguiente
        if (paginaActual < totalPaginas) {
            paginationContainer.innerHTML += `<a href="index.html?${queryString}&pagina=${paginaActual + 1}" class="page-link">Siguiente</a>`;
        }
    }

    // --- 4. FUNCIÓN PRINCIPAL DE CARGA ---
    async function fetchNews() {
        const { query, categoria, pais, pagina } = getUrlParams();
        updateActiveCategory(query, categoria, pais);

        // Limpiamos y mostramos el loader
        articlesContainer.innerHTML = '';
        loadingMessage.style.display = 'block';
        paginationContainer.innerHTML = ''; // Limpiamos la paginación

        try {
            let url = `${API_URL}/api/articles?sitio=${SITIO}&limite=${LIMITE_POR_PAGINA}&pagina=${pagina}`;
            
            // Lógica de filtros: query tiene prioridad sobre país/categoría
            if (query) {
                url += `&query=${query}`;
            } else if (pais) {
                url += `&pais=${pais}`;
            } else {
                url += `&categoria=${categoria}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);

            const data = await response.json();
            const articles = data.articulos;

            // Ocultamos el loader
            loadingMessage.style.display = 'none';
            articlesContainer.innerHTML = ''; 

            if (articles.length === 0) {
                const message = query 
                    ? `No se encontraron resultados para "${query}".`
                    : 'No se encontraron noticias en esta sección.';
                articlesContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--color-texto-secundario); padding: 4rem 0;">${message}</p>`;
            } else {
                
                articles.forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'article-card';

                    // Lógica de Bandera
                    let infoFuente = `<span>Fuente: ${article.fuente}</span>`;
                    if (article.pais && BANDERAS[article.pais]) {
                        const bandera = BANDERAS[article.pais].split(' ')[0]; 
                        infoFuente = `<span>${bandera} ${article.fuente}</span>`;
                    }
                    
                    card.innerHTML = `
                        <a href="articulo.html?id=${article._id}">
                            <img src="${article.imagen}" alt="${article.titulo}" loading="lazy">
                        </a>
                        <div class="article-card-content">
                            <h3>
                                <a href="articulo.html?id=${article._id}">${article.titulo}</a>
                            </h3>
                            <p>${article.descripcion.substring(0, 120)}...</p>
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
            articlesContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: red; padding: 4rem 0;">Error al cargar las noticias. Intente recargar la página.</p>';
        }
    }
    
    // --- 5. EVENT LISTENERS PARA BÚSQUEDA ---
    
    // El formulario ya funciona por defecto (al usar method="GET" y name="query"), 
    // pero podemos añadir un listener para prevenir el envío y forzar el uso de JS si fuera necesario.
    // Lo dejaremos simple:
    
    // Al hacer clic en "Limpiar Búsqueda"
    clearSearchButton.addEventListener('click', () => {
        window.location.href = 'index.html?categoria=todos'; // Volver a la página principal/general
    });

    // Inicia la carga de noticias
    fetchNews();
});