// Estado de la aplicación para la página principal
const appState = {
    user: null,
    preferences: {
        genres: [],
        frequency: '',
        author: ''
    },
    books: []
};

// Review Modal
let currentRating = 0;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const savedUser = localStorage.getItem('user');
    const savedPreferences = localStorage.getItem('preferences');
    
    if (!savedUser) {
        window.location.href = 'index.html';
        return;
    }

    // Verificar si tiene preferencias
    if (!savedPreferences || !JSON.parse(savedPreferences).frequency) {
        window.location.href = 'preferences.html';
        return;
    }

    // Cargar datos
    appState.user = JSON.parse(savedUser);
    appState.preferences = JSON.parse(savedPreferences);
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
        appState.books = JSON.parse(savedBooks);
    }

    // Inicializar página
    renderBooks();
    setupEventListeners();
});

function setupEventListeners() {
    // Add Book Form
    document.getElementById('addBookForm').addEventListener('submit', handleAddBook);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Share QR
    document.getElementById('shareQRBtn').addEventListener('click', showQRModal);

    // Review Form
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);
}

// Books Management
function handleAddBook(e) {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const genre = document.getElementById('bookGenre').value;

    const book = {
        id: Date.now(),
        title: title.trim(),
        author: author.trim(),
        genre: genre,
        rating: 0,
        review: '',
        dateAdded: new Date().toISOString()
    };

    appState.books.push(book);
    localStorage.setItem('books', JSON.stringify(appState.books));

    // Limpiar formulario
    e.target.reset();
    renderBooks();

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
    modal.hide();

    // Mostrar mensaje de éxito
    showNotification('Libro agregado correctamente', 'success');
}

function renderBooks() {
    const booksList = document.getElementById('booksList');
    
    if (appState.books.length === 0) {
        booksList.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-book"></i>
                    <h5>No tienes libros registrados</h5>
                    <p>Comienza agregando tu primer libro</p>
                </div>
            </div>
        `;
        return;
    }

    booksList.innerHTML = appState.books.map(book => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card book-card shadow-sm border-0">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(book.title)}</h5>
                    <p class="text-muted mb-2">
                        <i class="bi bi-person"></i> ${escapeHtml(book.author)}
                    </p>
                    <p class="mb-2">
                        <span class="badge bg-secondary">${escapeHtml(book.genre)}</span>
                    </p>
                    ${book.rating > 0 ? `
                        <div class="book-rating mb-2">
                            ${renderStars(book.rating)}
                            <span class="ms-1">${book.rating}/5</span>
                        </div>
                    ` : ''}
                    ${book.review ? `
                        <p class="text-muted small mb-2">
                            <i class="bi bi-chat-left-text"></i> ${escapeHtml(book.review.substring(0, 100))}${book.review.length > 100 ? '...' : ''}
                        </p>
                    ` : ''}
                    <div class="book-actions">
                        <button class="btn btn-sm btn-outline-primary w-100" onclick="openReviewModal(${book.id})">
                            <i class="bi bi-star"></i> ${book.rating > 0 ? 'Editar Reseña' : 'Agregar Reseña'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="bi bi-star-fill"></i>';
        } else {
            stars += '<i class="bi bi-star"></i>';
        }
    }
    return stars;
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('#reviewModal .rating-star');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    const ratingTextEl = document.getElementById('ratingText');
    if (ratingTextEl) {
        ratingTextEl.textContent = `${rating} estrella${rating !== 1 ? 's' : ''}`;
    }
}

function updateRatingDisplay() {
    highlightStars(currentRating);
}

function openReviewModal(bookId) {
    const book = appState.books.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('reviewModalTitle').textContent = `Reseña: ${book.title}`;
    document.getElementById('reviewBookId').value = bookId;
    currentRating = book.rating || 0;
    document.getElementById('reviewText').value = book.review || '';
    
    // Actualizar display después de que el modal se muestre
    setTimeout(() => {
        updateRatingDisplay();
        setupModalRatingStars();
    }, 100);

    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

function setupModalRatingStars() {
    const stars = document.querySelectorAll('#reviewModal .rating-star');
    const ratingContainer = document.querySelector('#reviewModal .rating');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            currentRating = parseInt(this.getAttribute('data-rating'));
            updateRatingDisplay();
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
        });
    });

    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', () => {
            highlightStars(currentRating);
        });
    }
}

function handleReviewSubmit(e) {
    e.preventDefault();
    const bookId = parseInt(document.getElementById('reviewBookId').value);
    const review = document.getElementById('reviewText').value.trim();

    const book = appState.books.find(b => b.id === bookId);
    if (book) {
        book.rating = currentRating;
        book.review = review;
        localStorage.setItem('books', JSON.stringify(appState.books));
        renderBooks();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        modal.hide();
        
        showNotification('Reseña guardada correctamente', 'success');
    }
}

// QR Code
function showQRModal() {
    const profileData = {
        name: appState.user?.name || 'Usuario',
        preferences: appState.preferences,
        books: appState.books.map(book => ({
            title: book.title,
            author: book.author,
            genre: book.genre,
            rating: book.rating
        })),
        stats: {
            totalBooks: appState.books.length,
            averageRating: appState.books.length > 0 
                ? (appState.books.reduce((sum, b) => sum + (b.rating || 0), 0) / appState.books.length).toFixed(1)
                : 0
        }
    };

    const qrText = `Perfil Literario de ${profileData.name}\n\n` +
                   `Total de libros: ${profileData.stats.totalBooks}\n` +
                   `Calificación promedio: ${profileData.stats.averageRating}/5\n\n` +
                   `Géneros favoritos: ${profileData.preferences.genres.join(', ') || 'No especificados'}\n` +
                   `Frecuencia de lectura: ${profileData.preferences.frequency || 'No especificada'}\n` +
                   (profileData.preferences.author ? `Autor favorito: ${profileData.preferences.author}\n` : '');

    // Generar QR
    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = '';
    
    QRCode.toCanvas(qrcodeDiv, qrText, {
        width: 256,
        margin: 2,
        color: {
            dark: '#1f2937',
            light: '#ffffff'
        }
    }, (error) => {
        if (error) {
            console.error('Error generating QR:', error);
            qrcodeDiv.innerHTML = '<p class="text-danger">Error al generar el código QR</p>';
        }
    });

    // Actualizar nombre en el header
    document.getElementById('profileName').textContent = profileData.name;

    // Mostrar información del perfil
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <div class="profile-stat mb-3">
            <div class="stat-icon">
                <i class="bi bi-book text-primary"></i>
            </div>
            <div class="stat-content">
                <strong>${profileData.stats.totalBooks}</strong>
                <small class="text-muted d-block">Libros registrados</small>
            </div>
        </div>
        <div class="profile-stat mb-3">
            <div class="stat-icon">
                <i class="bi bi-star-fill text-warning"></i>
            </div>
            <div class="stat-content">
                <strong>${profileData.stats.averageRating}/5</strong>
                <small class="text-muted d-block">Calificación promedio</small>
            </div>
        </div>
        <div class="profile-stat mb-3">
            <div class="stat-icon">
                <i class="bi bi-tags text-info"></i>
            </div>
            <div class="stat-content">
                <strong>${profileData.preferences.genres.length || 0}</strong>
                <small class="text-muted d-block">Géneros favoritos</small>
            </div>
        </div>
        ${profileData.preferences.genres.length > 0 ? `
            <div class="genres-badges mb-3">
                ${profileData.preferences.genres.map(genre => 
                    `<span class="badge bg-primary me-1 mb-1">${escapeHtml(genre)}</span>`
                ).join('')}
            </div>
        ` : ''}
        ${profileData.preferences.frequency ? `
            <div class="frequency-info">
                <i class="bi bi-clock text-secondary"></i>
                <span class="ms-1">Lee: <strong>${escapeHtml(profileData.preferences.frequency)}</strong></span>
            </div>
        ` : ''}
        ${profileData.preferences.author ? `
            <div class="author-info mt-2">
                <i class="bi bi-person-heart text-danger"></i>
                <span class="ms-1">Autor favorito: <strong>${escapeHtml(profileData.preferences.author)}</strong></span>
            </div>
        ` : ''}
    `;

    const modal = new bootstrap.Modal(document.getElementById('qrModal'));
    modal.show();
}

// Logout
function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('preferences');
        localStorage.removeItem('books');
        localStorage.removeItem('hasSeenIntro');
        window.location.href = 'index.html';
    }
}

// Hacer funciones disponibles globalmente
window.openReviewModal = openReviewModal;

