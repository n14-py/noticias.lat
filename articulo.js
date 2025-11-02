document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURACIÓN E ELEMENTOS ---
    const API_URL = 'https://lfaftechapi.onrender.com'; 
    const PLACEHOLDER_IMG = 'images/placeholder.jpg'; // Imagen de respaldo

    const articleContainer = document.getElementById('article-content');
    const loadingMessage = document.getElementById('loading-message');
    
    if (!articleContainer) {
        return; 
    }
    
    const recommendedSection = document.getElementById('recommended-section');
    const recommendedContainer = document.getElementById('recommended-container');


    // --- 2. FUNCIONES DE UTILERÍA ---
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // ¡NUEVA FUNCIÓN PARA CREAR BOTONES DE COMPARTIR!
    function createShareButtons(url, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);

        return `
            <div class="share-buttons">
                <h4>Compartir esta noticia:</h4>
                <a href="https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}" class="share-btn whatsapp" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" class="share-btn twitter" target="_blank" rel="noopener"><i class="fab fa-twitter"></i> Twitter</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" class="share-btn facebook" target="_blank" rel="noopener"><i class="fab fa-facebook"></i> Facebook</a>
                <a href="mailto:?subject=${encodedTitle}&body=Mira esta noticia:%20${encodedUrl}" class="share-btn email" target="_blank" rel="noopener"><i class="fas fa-envelope"></i> Email</a>
            </div>
        `;
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
                    
                    const imagenUrl = article.imagen || PLACEHOLDER_IMG;
                    
                    card.innerHTML = `
                        <a href="articulo.html?id=${article._id}" class="article-card-image-link">
                            <img src="${imagenUrl}" alt="${article.titulo}" loading="lazy" 
                                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">
                        </a>
                        <div class="article-card-content">
                            <h3>
                                <a href="articulo.html?id=${article._id}">${article.titulo}</a>
                            </h3>
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


    // --- 3. FUNCIÓN PRINCIPAL (fetchSingleArticle) ---
    async function fetchSingleArticle() {
        if (loadingMessage) loadingMessage.style.display = 'block';

        try {
            const params = new URLSearchParams(window.location.search);
            const articleId = params.get('id');
            if (!articleId) throw new Error("No se proporcionó un ID de artículo.");

            const response = await fetch(`${API_URL}/api/article/${articleId}`);
            if (!response.ok) throw new Error(`Artículo no encontrado: ${response.statusText}`);

            const article = await response.json();
            
            if (loadingMessage) loadingMessage.style.display = 'none';
            
            // ===========================================
            // --- 1. LÓGICA DE SEO/OPEN GRAPH (METATAGS) ---
            // ===========================================
            const currentUrl = `${window.location.origin}${window.location.pathname}?id=${article._id}`;
            const descriptionSnippet = (article.descripcion || 'Sin descripción').substring(0, 150) + '...';
            const imageUrl = article.imagen || PLACEHOLDER_IMG;
            
            document.title = `${article.titulo} - Noticias.lat`;
            
            let metaDescription = document.getElementById('meta-description');
            if (metaDescription) metaDescription.setAttribute('content', descriptionSnippet);

            document.getElementById('og-title').setAttribute('content', article.titulo);
            document.getElementById('og-description').setAttribute('content', descriptionSnippet);
            document.getElementById('og-url').setAttribute('content', currentUrl);
            document.getElementById('og-image').setAttribute('content', imageUrl);

            const canonicalLink = document.getElementById('canonical-link');
            if (canonicalLink) canonicalLink.setAttribute('href', currentUrl);

            // ===========================================
            // --- 2. DATOS ESTRUCTURADOS (SCHEMA.ORG) ---
            // ===========================================
            
            const oldSchema = document.getElementById('article-schema');
            if (oldSchema) oldSchema.remove();

            const schema = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": article.titulo,
                "image": [ imageUrl ],
                "datePublished": article.fecha,
                "dateModified": article.updatedAt || article.fecha,
                "author": [{"@type": "Organization", "name": "Noticias.lat"}],
                "publisher": {
                    "@type": "Organization",
                    "name": "Noticias.lat",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://www.noticias.lat/favicon.png"
                    }
                },
                "description": descriptionSnippet
            };

            const schemaScript = document.createElement('script');
            schemaScript.type = 'application/ld+json';
            schemaScript.id = 'article-schema';
            schemaScript.text = JSON.stringify(schema);
            document.head.appendChild(schemaScript);
            
            // ===========================================
            // --- 3. LÓGICA DE CONTENIDO HTML ---
            // ===========================================
            
            let contenidoPrincipalHTML = '';

            if (article.articuloGenerado) {
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
                const contenidoLimpio = article.contenido ? article.contenido.split(' [')[0] : (article.descripcion || 'Contenido no disponible.');
                contenidoPrincipalHTML = `
                    <p>${contenidoLimpio}</p>
                    <p><em>(Mostrando descripción breve.)</em></p>
                `;
            }

            // --- ¡NUEVO! HTML FINAL CON AD SLOTS Y BOTONES DE COMPARTIR ---
            
            const mainImageUrl = article.imagen || PLACEHOLDER_IMG;
            const shareButtonsHTML = createShareButtons(currentUrl, article.titulo);
            
            // (Una vez aprobado en AdSense, aquí pegarás el código de tu bloque de anuncios)
            const adSlotTopBanner = `
                <div classT="ad-slot-placeholder">
                    <p>Publicidad</p>
                </div>
            `;
            
            const adSlotBottom = `
                <div class="ad-slot-placeholder" style="min-height: 250px;">
                    <p>Publicidad</p>
                </div>
            `;

            articleContainer.innerHTML = `
                <h1>${article.titulo}</h1>
                
                ${adSlotTopBanner} <p class="article-meta">
                    Publicado el: ${formatDate(article.fecha)} | Fuente: ${article.fuente}
                </p>
                
                ${shareButtonsHTML} <img src="${mainImageUrl}" alt="${article.titulo}" class="article-main-image" 
                     onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">

                <div class="article-body">
                    ${contenidoPrincipalHTML}
                </div>

                <div class="article-source-link">
                    <p>Para leer la noticia en su publicación original, visite la fuente.</p>
                    <a href="${article.enlaceOriginal}" class="btn-primary" target="_blank" rel="noopener noreferrer">
                        Leer en ${article.fuente}
                    </a>
                </div>
                
                ${adSlotBottom} `;
            
            // --- 4. LLAMAR A RECOMENDADOS ---
            fetchRecommended(article.sitio, article.categoria, article._id);

        } catch (error) {
            console.error('Error al cargar el artículo:', error);
            if(articleContainer) {
                articleContainer.innerHTML = `
                    <div class="static-page-container" style="text-align: center;">
                        <h1 style="font-size: 2rem;">Error al Cargar</h1>
                        <p>Lo sentimos, no se pudo encontrar el artículo solicitado o hubo un error en la conexión. Es posible que el enlace sea incorrecto o el artículo haya sido eliminado.</p>
                        <a href="index.html" class="btn-primary" style="margin-top: 20px;">Ir a la Página Principal</a>
                    </div>
                `;
            }
        }
    }

    // Inicia la carga del artículo individual
    fetchSingleArticle();
});