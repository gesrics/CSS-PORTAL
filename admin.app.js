const CORE_ACCESS_KEY = "DNHS_ADMIN_2026"; 

// ⚡ SUPABASE PRODUCTION CREDENTIALS (Palitan ng inyong actual values)
const DB_URL = "https://kofyybvvzzlcxemwlaqu.supabase.co"; 
const DB_KEY = "sb_publishable_EXyi06rbFxY4OUV1XRyfjw_omMnlxFN..."; 
const supabase = window.supabase ? window.supabase.createClient(DB_URL, DB_KEY) : null;

let pollingInterval = null;

window.onload = function() {
    const passInput = document.getElementById("adminPassword");
    if(passInput) {
        passInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') executeLogin();
        });
    }

    if (sessionStorage.getItem("admin_authenticated") === "true") {
        grantAccess(true); 
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById("adminPassword");
    const eyeSlash = document.getElementById("eyeSlash");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeSlash.style.opacity = "1";
    } else {
        passwordInput.type = "password";
        eyeSlash.style.opacity = "0";
    }
    passwordInput.focus(); 
}

function executeLogin() {
    const enteredPass = document.getElementById("adminPassword").value;
    const loginBtn = document.querySelector(".btn-auth");

    loginBtn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1)' }
    ], { duration: 150 });

    if (enteredPass === CORE_ACCESS_KEY) {
        grantAccess(false);
    } else {
        const card = document.querySelector(".login-card");
        card.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300 });

        alert("🔒 Access Denied: Invalid Administrative Token Key.");
        document.getElementById("adminPassword").value = "";
        document.getElementById("adminPassword").focus();
    }
}

function grantAccess(skipAnimation) {
    const gate = document.getElementById("loginGate");
    const content = document.getElementById("dashboardContent");

    if (skipAnimation) {
        gate.style.display = "none";
        content.style.display = "block";
    } else {
        gate.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.95)' }
        ], { duration: 400, easing: 'ease-in-out' }).onfinish = () => {
            gate.style.display = "none";
            content.style.display = "block";
            
            content.animate([
                { opacity: 0, transform: 'translateY(10px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 400 });
        };
    }
    
    streamDatastream();
    pollingInterval = setInterval(streamDatastream, 2000);
}

function executeLogout() {
    const content = document.getElementById("dashboardContent");
    
    content.animate([
        { opacity: 1 },
        { opacity: 0 }
    ], { duration: 300 }).onfinish = () => {
        sessionStorage.clear();
        clearInterval(pollingInterval);
        window.location.reload();
    };
}

async function streamDatastream() {
    let { data: sessions, error } = await supabase.from('active_sessions').select('*');
    if (!error && sessions) {
        sessions.forEach(session => {
            const nodePayload = session.student_id ? { 
                studentId: session.student_id, 
                studentName: session.student_name, 
                timeIn: new Date(session.time_in).toLocaleTimeString() 
            } : null;
            updateAdminDashboardUI(session.pc_number, nodePayload);
        });
    }
}

function updateAdminDashboardUI(id, data) {
    const slot = document.getElementById(`slot${id}`);
    const badge = document.getElementById(`badge${id}`);
    const lrn = document.getElementById(`lrn${id}`);
    const name = document.getElementById(`name${id}`);
    const time = document.getElementById(`time${id}`);

    if (data) {
        if (!slot.classList.contains('occupied')) {
            slot.classList.add('occupied');
            slot.animate([
                { transform: 'scale(0.98)', opacity: 0.8 },
                { transform: 'scale(1)', opacity: 1 }
            ], { duration: 300 });
        }
        badge.className = "state-badge state-occupied";
        badge.innerText = "Occupied";
        lrn.innerText = data.studentId;
        name.innerText = data.studentName;
        time.innerText = data.timeIn;
    } else {
        slot.classList.remove('occupied');
        badge.className = "state-badge state-vacant";
        badge.innerText = "Vacant";
        lrn.innerText = "--";
        name.innerText = "None";
        time.innerText = "--:-- --";
    }
}
