// ========================
// Configuración inicial
// ========================

// Verificar autenticación
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/public/index.html";
}


// Configuración base
const API_BASE_URL = "https://notas-aplicacion-backend.onrender.com/api/notes";
const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};
async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/public/index.html";
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        
        const rawResponse = await response.text();  // Obtener la respuesta como texto
        console.log('Raw Response:', rawResponse);  // Ver la respuesta antes de convertirla a JSON
        return JSON.parse(rawResponse);  // Intentar convertirlo en JSON
    } catch (error) {
        console.error('API Error:', error);
        showAlert(error.message, 'error');
        throw error;
    }
}

// Elementos DOM
const elements = {
    categorySelect: document.getElementById('categorySelect'),
    activeNotes: document.getElementById('activeNotes'),
    archivedNotes: document.getElementById('archivedNotes'),
    noteForm: document.getElementById('noteForm'),
    toggleArchived: document.getElementById('toggleArchived'),
    toggleActive: document.getElementById('toggleActive')
};

// ========================
// Funciones de API (Wrapper)
// ========================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "../index.html";
}


async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "../index.html";
            return;
        }

        if (response.status === 403) {
            throw new Error("No tenés permiso para realizar esta acción (403 Forbidden).");
        }

        if (response.status === 204) {
            return null; // Sin contenido
        }

        const text = await response.text();
        if (!text) return null; // Para prevenir 'Unexpected end of JSON input'
        
        return JSON.parse(text); // Parsear JSON manualmente para evitar errores en respuestas vacías

    } catch (error) {
        console.error("API Error:", error);
        showAlert(error.message || "Error de red o del servidor", "error");
        throw error;
    }
}

// ========================
// Funciones de Notas
// ========================

async function fetchNotes() {
    try {
        const [activeNotes, archivedNotes] = await Promise.all([
            fetchAPI(`${API_BASE_URL}/status/false`),
            fetchAPI(`${API_BASE_URL}/status/true`)
        ]);
        
        displayNotes(activeNotes, elements.activeNotes);
        displayNotes(archivedNotes, elements.archivedNotes);
    } catch (error) {
        // El error ya se maneja en fetchAPI
    }
}

function displayNotes(notes, container) {
    container.innerHTML = '';
    notes.forEach(note => {
        container.appendChild(createNoteCard(note));
    });
}

function createNoteCard(note) {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    noteCard.dataset.id = note.id;
    noteCard.dataset.category = note.category.toLowerCase();
    
    noteCard.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.content}</p>
        <p><strong>Category:</strong> ${note.category}</p>
        <div class="note-actions">
            <button class="edit-btn">✏️ Edit</button>
            <button class="archive-btn">${note.archived ? '📂 Unarchive' : '📁 Archive'}</button>
            <button class="delete-btn">🗑️ Delete</button>
        </div>
    `;
    
    // Event listeners
    noteCard.querySelector('.edit-btn').addEventListener('click', () => editNote(note));
    noteCard.querySelector('.archive-btn').addEventListener('click', () => toggleArchive(note.id));
    noteCard.querySelector('.delete-btn').addEventListener('click', () => deleteNote(note.id));
    
    return noteCard;
}

// ========================
// Operaciones CRUD
// ========================

async function editNote(note) {
    const newTitle = prompt("Edit title:", note.title);
    if (!newTitle) return;
    
    const newContent = prompt("Edit content:", note.content);
    const newCategory = prompt("Edit category:", note.category);
    
    try {
        await fetchAPI(`${API_BASE_URL}/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                title: newTitle, 
                content: newContent, 
                category: newCategory 
            })
        });
        await fetchNotes();
        showAlert('Note updated successfully!', 'success');
    } catch (error) {
        // Error ya manejado
    }
}

async function toggleArchive(noteId) {
    try {
        await fetchAPI(`${API_BASE_URL}/${noteId}/archive`, {
            method: 'PATCH'
        });
        await fetchNotes();
        showAlert('Note status changed!', 'success');
    } catch (error) {
        // Error ya manejado
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
        await fetchAPI(`${API_BASE_URL}/${noteId}`, {
            method: 'DELETE'
        });
        await fetchNotes();
        showAlert('Note deleted!', 'success');
    } catch (error) {
        // Error ya manejado
    }
}

// ========================
// Formulario de Notas
// ========================

elements.noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newNote = {
        title: formData.get('noteTitle').trim(),
        content: formData.get('noteContent').trim(),
        category: formData.get('noteCategory').trim(),
        archived: false
    };
    console.log(newNote);
    try {
        await fetchAPI(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(newNote)
        });
        e.target.reset();
        await fetchNotes();
        showAlert('Note created successfully!', 'success');
    } catch (error) {
        // Error ya manejado
    }
});

// ========================
// Filtros y Categorías
// ========================
async function loadCategories() {
    try {
        const response = await fetchAPI(`${API_BASE_URL}/categories`);

  

        const select = document.getElementById('categorySelect');
        select.innerHTML = '<option value="">Todas</option>'; // reset
        
        response.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    } catch (error) {
        showAlert('Error al cargar categorías', 'error');
    }
}

// ========================
// UI Helpers
// ========================

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Toggle sections
elements.toggleArchived.addEventListener('click', () => {
    elements.archivedNotes.classList.toggle('hidden');
    elements.toggleArchived.textContent = 
        elements.archivedNotes.classList.contains('hidden') ? 
        'Archived Notes ▼' : 'Archived Notes ▲';
});

elements.toggleActive.addEventListener('click', () => {
    elements.activeNotes.classList.toggle('hidden');
    elements.toggleActive.textContent = 
        elements.activeNotes.classList.contains('hidden') ? 
        'Active Notes ▼' : 'Active Notes ▲';
});

// ========================
// Inicialización
// ========================

document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();
    loadCategories();
});


