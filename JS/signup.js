const signupForm = document.getElementById("signupForm");
const messageDiv = document.getElementById("message");

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageDiv.style.display = 'none'; // Resetear mensajes

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validación frontend
    if (password !== confirmPassword) {
        showError("Passwords do not match!");
        return;
    }

    if (password.length < 8) {
        showError("Password must be at least 8 characters");
        return;
    }

    try {
        const response = await fetch("http://notas-aplicacion-backend.onrender.com/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: 'include', // Importante para cookies/JWT
            body: JSON.stringify({ 
                email: email,
                password: password,
                passwordConfirm: confirmPassword // Asegúrate que coincide con tu DTO en Spring
            })
        });

        const responseText = await response.text();
        let data = {};
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }

        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        }

        showSuccess(data.message || "Registration successful!");
        
        setTimeout(() => {
            window.location.href = "/public/index.html";
        }, 2000);

    } catch (error) {
        showError(error.message);
        console.error("Signup error:", error);
    }
});

// Helper functions
function showError(message) {
    messageDiv.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    messageDiv.style.display = 'block';
}

function showSuccess(message) {
    messageDiv.innerHTML = `<div class="alert alert-success">${message}</div>`;
    messageDiv.style.display = 'block';
}