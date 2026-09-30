// =========================================
// 1. IMPORTS DE FIREBASE (¡SIEMPRE AL PRINCIPIO!)
// =========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================================
// 2. CONFIGURACIÓN DE FIREBASE
// =========================================
const firebaseConfig = {
  apiKey: "AIzaSyCoQjg0tBUQqSwsiT8ysIIElcfPg3PxuGE",
  authDomain: "tu-espacio-psicologa.firebaseapp.com",
  projectId: "tu-espacio-psicologa",
  storageBucket: "tu-espacio-psicologa.firebasestorage.app",
  messagingSenderId: "943907499285",
  appId: "1:943907499285:web:bf11534c63686813aa8d1c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// =========================================
// 3. LÓGICA DE LA PÁGINA (DOM)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- A. MENÚ HAMBURGUESA ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }

    // --- B. MODAL DE CONTACTO ---
    const contactModal = document.getElementById('contactModal');
    const modalClose = document.querySelector('.modal-close');
    const contactLink = document.querySelector('a[href="#contacto"]');

    if (contactLink && contactModal) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (modalClose && contactModal) {
        modalClose.addEventListener('click', () => {
            contactModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
            contactModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // --- C. CARRUSEL DE TESTIMONIOS (ESTÁTICO) ---
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentTestimonial = 0;
    let autoPlayInterval;

    if (testimonialCards.length > 0) {
        function showTestimonial(index) {
            testimonialCards.forEach(card => card.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            testimonialCards[index].classList.add('active');
            if (dots[index]) dots[index].classList.add('active');
            currentTestimonial = index;
        }

        function nextTestimonial() {
            const next = (currentTestimonial + 1) % testimonialCards.length;
            showTestimonial(next);
        }

        function prevTestimonial() {
            const prev = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
            showTestimonial(prev);
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextTestimonial();
                resetAutoPlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevTestimonial();
                resetAutoPlay();
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showTestimonial(index);
                resetAutoPlay();
            });
        });

        function startAutoPlay() {
            autoPlayInterval = setInterval(nextTestimonial, 5000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        startAutoPlay();
    }

    // --- D. FIREBASE: LOGIN / LOGOUT ---
    const btnLogin = document.getElementById('btnLoginGoogle');
    const btnLogout = document.getElementById('btnLogout');
    const loginSection = document.getElementById('loginSection');
    const formSection = document.getElementById('reviewFormSection');

    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            signInWithPopup(auth, provider).catch((error) => console.error("Error login:", error));
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => signOut(auth));
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (loginSection) loginSection.classList.add('hidden');
            if (formSection) formSection.classList.remove('hidden');
            
            const userPhoto = document.getElementById('userPhoto');
            const userName = document.getElementById('userName');
            if (userPhoto) userPhoto.src = user.photoURL;
            if (userName) userName.textContent = "Hola, " + user.displayName;
        } else {
            if (loginSection) loginSection.classList.remove('hidden');
            if (formSection) formSection.classList.add('hidden');
        }
    });

    // --- E. FIREBASE: PUBLICAR TESTIMONIO ---
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = document.getElementById('reviewText').value;
            const user = auth.currentUser;

            if (text.trim() !== "" && user) {
                const submitBtn = reviewForm.querySelector('button[type="submit"]');
                submitBtn.textContent = "Publicando...";
                submitBtn.disabled = true;

                try {
                    await addDoc(collection(db, "testimonios"), {
                        texto: text,
                        nombre: user.displayName,
                        foto: user.photoURL,
                        fecha: serverTimestamp()
                    });
                    
                    alert("¡Gracias por tu testimonio! Tu opinión ayudará a otros. 🙏");
                    await signOut(auth);
                    window.location.reload(); 

                } catch (error) {
                    console.error("Error al publicar:", error);
                    alert("Hubo un error al publicar. Intenta de nuevo.");
                    submitBtn.textContent = "Publicar testimonio";
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // --- F. FIREBASE: LEER TESTIMONIOS EN TIEMPO REAL ---
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (reviewsContainer) {
        const q = query(collection(db, "testimonios"), orderBy("fecha", "desc"));
        
        onSnapshot(q, (snapshot) => {
            reviewsContainer.innerHTML = ""; 
            
            if (snapshot.empty) {
                reviewsContainer.innerHTML = "<p class='empty-message'>Aún no hay testimonios. ¡Sé el primero!</p>";
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                let fechaTexto = "Reciente";
                if (data.fecha) {
                    const fecha = new Date(data.fecha.seconds * 1000);
                    fechaTexto = fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
                }
                
                const card = document.createElement('div');
                card.className = 'review-card';
                card.innerHTML = `
                    <div class="review-header">
                        <img src="${data.foto}" alt="${data.nombre}" class="review-photo">
                        <div>
                            <strong>${data.nombre}</strong>
                            <span class="review-date">${fechaTexto}</span>
                        </div>
                    </div>
                    <p class="review-text">"${data.texto}"</p>
                `;
                reviewsContainer.appendChild(card);
            });
        });
    }

    // =========================================
    // --- G. MODAL DINÁMICO DE SERVICIOS (NUEVO) ---
    // =========================================
    const serviceTriggers = document.querySelectorAll('.service-trigger');
    const serviceModal = document.getElementById('serviceModal');
    const serviceModalTitle = document.getElementById('serviceModalTitle');
    const serviceModalDesc = document.getElementById('serviceModalDesc');
    const serviceModalClose = serviceModal ? serviceModal.querySelector('.modal-close') : null;

    // Función para abrir el modal con los datos de la tarjeta
    serviceTriggers.forEach(card => {
        card.addEventListener('click', () => {
            // 1. Obtener datos de la tarjeta clickeada
            const title = card.getAttribute('data-title');
            const desc = card.getAttribute('data-desc');
            
            // 2. Inyectar datos en el modal
            if (serviceModalTitle) serviceModalTitle.textContent = title;
            if (serviceModalDesc) serviceModalDesc.textContent = desc;
            
            // 3. Actualizar el enlace de WhatsApp con el tema específico
            const waButton = serviceModal.querySelector('.btn-primary');
            if (waButton) {
                // ⚠️ CAMBIA ESTE NÚMERO POR EL REAL
                const phone = "56912345678"; 
                const waText = `Hola, me interesa agendar una sesión sobre: ${title}`;
                waButton.href = `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`;
            }

            // 4. Mostrar el modal y bloquear scroll
            if (serviceModal) {
                serviceModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Funciones para cerrar el modal de servicios
    if (serviceModalClose && serviceModal) {
        serviceModalClose.addEventListener('click', () => {
            serviceModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (serviceModal) {
        serviceModal.addEventListener('click', (e) => {
            if (e.target === serviceModal) {
                serviceModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && serviceModal && serviceModal.classList.contains('active')) {
            serviceModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

}); // <-- FIN DEL DOMContentLoaded