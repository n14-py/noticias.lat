document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LÓGICA DEL MENÚ MÓVIL (Existente y funcional) ---
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
    // --- FIN DE LÓGICA de MENÚ ---


    // --- 2. CONFIGURACIÓN E ELEMENTOS ---
    const API_URL = 'https://lfaftechapi.onrender.com'; 

    const articleContainer = document.getElementById('article-content');
    const loadingMessage = document.getElementById('loading-message');
    
    if (!articleContainer) {
        return; // Detener si no estamos en articulo.html
    }
    
    const recommendedSection = document.getElementById('recommended-section');
    const recommendedContainer = document.getElementById('recommended-container');


    // --- 3. FUNCIONES DE UTILERÍA ---
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
    
    async function fetchRecommended(sitio, categoria, excludeId) {
        try {
            const url = `${API_URL}/api/articles/recommended?sitio=${sitio}&categoria=${categoria}&excludeId=${excludeId}`;
            const response = await fetch(url);
            if (!response.ok) return; 

            const articles = await response.json();
            
            if (articles.length > 0) {
                recommendedContainer.innerHTML = ''; 
                articles.forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'article-card';
                    card.innerHTML = `
                        <a href="articulo.html?id=${article._id}">
                            <img src="${article.imagen}" alt="${article.titulo}" loading="lazy">
                        </a>
                        <div class="article-card-content">
                            <h3>
                                <a href="articulo.html?id=${article._id}">${article.titulo}</a>
                            </h3>
                            <div class="article-card-footer">
                                <span>${article.fuente}</span>
                            </div>
                        </div>
                    `;
                    recommendedContainer.appendChild(card);
                });
                recommendedSection.style.display = 'block';
            }
        } catch (error) {
            console.error("Error cargando recomendados:", error);
        }
    }


    // --- 4. FUNCIÓN PRINCIPAL (fetchSingleArticle) ---
    async function fetchSingleArticle() {
        loadingMessage.style.display = 'block';

        try {
            const params = new URLSearchParams(window.location.search);
            const articleId = params.get('id');
            if (!articleId) throw new Error("No se proporcionó un ID de artículo.");

            const response = await fetch(`${API_URL}/api/article/${articleId}`);
            if (!response.ok) throw new Error(`Artículo no encontrado: ${response.statusText}`);

            const article = await response.json();
            
            loadingMessage.style.display = 'none';
            
            // ===========================================
            // --- ¡NUEVA LÓGICA DE SEO/OPEN GRAPH! ---
            // ===========================================
            const currentUrl = `${window.location.origin}${window.location.pathname}?id=${article._id}`;
            const descriptionSnippet = article.descripcion.substring(0, 150) + '...';
            
            // 1. Título de la pestaña
            document.title = `${article.titulo} - Noticias.lat`;
            
            // 2. Meta Descripción (Para SEO)
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) { // Si no existe, lo creamos
                 metaDescription = document.createElement('meta');
                 metaDescription.name = 'description';
                 document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute('content', descriptionSnippet);

            // 3. Etiquetas Open Graph (Para redes sociales)
            document.getElementById('og-title').setAttribute('content', article.titulo);
            document.getElementById('og-description').setAttribute('content', descriptionSnippet);
            document.getElementById('og-url').setAttribute('content', currentUrl);
            document.getElementById('og-image').setAttribute('content', article.imagen);

            // 4. Link Canónico (Para evitar contenido duplicado en SEO)
            const canonicalLink = document.querySelector('link[rel="canonical"]');
            if (canonicalLink) {
                 canonicalLink.setAttribute('href', currentUrl);
            }
            // ===========================================
            // --- FIN DE LÓGICA SEO/OG ---
            // ===========================================


            // Lógica de contenido: priorizar el artículo generado por IA
            let contenidoPrincipalHTML = '';

            if (article.articuloGenerado) {
                // Limpieza y conversión a párrafos
                const textoLimpio = article.articuloGenerado
                    .replace(/##\s/g, '')       
                    .replace(/\*\*/g, '')      
                    .replace(/\* /g, '')       
                    .replace(/[^\x00-\x7F\ñ\Ñ\á\é\í\ó\ú\Á\É\Í\Ó\Ú\¿\¡]/g, ' '); 
                
                contenidoPrincipalHTML = textoLimpio
                    .split('\n')
                    .filter(p => p.trim() !== '') 
                    .map(p => `<p>${p}</p>`)      
                    .join('');                   
            } else {
                // Fallback
                const contenidoLimpio = article.contenido ? article.contenido.split(' [')[0] : article.descripcion;
                contenidoPrincipalHTML = `
                    <p>${contenidoLimpio}</p>
                    <p><em>(Esta noticia no pudo ser procesada por nuestro reportero. Mostrando descripción breve.)</em></p>
                `;
            }


            // --- HTML FINAL (Usando la estructura Article Page) ---
            articleContainer.innerHTML = `
                <h1>${article.titulo}</h1>
                <p class="article-meta">
                    Publicado el: ${formatDate(article.fecha)} | Fuente: ${article.fuente}
                </p>
                <img src="${article.imagen}" alt="${article.titulo}" class="article-main-image">

                <div class="article-body">
                    ${contenidoPrincipalHTML}
                </div>

                <div class="article-source-link">
                    <p>Para leer la noticia en su publicación original, visite la fuente.</p>
                    <a href="${article.enlaceOriginal}" class="btn-primary" target="_blank" rel="noopener noreferrer">
                        Leer en ${article.fuente}
                    </a>
                </div>
            `;
            
            // Llamamos a los recomendados
            fetchRecommended(article.sitio, article.categoria, article._id);

        } catch (error) {
            console.error('Error al cargar el artículo:', error);
            // Reemplazamos el contenido con un mensaje de error si la carga falla
            articleContainer.innerHTML = `
                <div class="static-page-container">
                    <h1>Error de Carga</h1>
                    <p>Lo sentimos, no se pudo encontrar el artículo solicitado o hubo un error en la conexión. Por favor, vuelva a la página principal.</p>
                    <a href="index.html" class="btn-primary" style="margin-top: 20px;">Ir a la Página Principal</a>
                </div>
            `;
        }
    }

    // Inicia la carga del artículo individual
    fetchSingleArticle();
});