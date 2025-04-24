document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: 'include', // Importante para cookies/JWT
            body: JSON.stringify({ 
                email: email,
                password: password
             
            })
        });

        const responseText = await response.text();
        let data = {};
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            throw new Error("Respuesta inválida del servidor");
        }

        if (!response.ok) {
            const errorMsg = data.message || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMsg);
        }

        if (!data.token) {
            throw new Error("No se recibió token en la respuesta");
        }

        localStorage.setItem('token', data.token);
        window.location.href = "/frontend/frontend/notes.html";

    } catch (error) {
        console.error("Error en el login:", error);
        messageDiv.innerHTML = `
            <div class="alert alert-danger">
                ${error.message || 'Error en el proceso de autenticación'}
            </div>
        `;
        messageDiv.style.display = 'block';
    }
});