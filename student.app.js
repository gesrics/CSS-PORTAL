const urlParams = new URLSearchParams(window.location.search);
const targetPC = urlParams.get('pc');
let timerRef = null;

// ⚡ SUPABASE PRODUCTION CREDENTIALS (Palitan ng inyong actual values)
const DB_URL = "https://kofyybvvzzlcxemwlaqu.supabase.co"; 
const DB_KEY = "sb_publishable_EXyi06rbFxY4OUV1XRyfjw_omMnlxFN..."; 
const supabase = window.supabase ? window.supabase.createClient(DB_URL, DB_KEY) : null;

window.onload = function() {
    if (!targetPC) return; 
    
    document.getElementById('gateLock').style.display = "none";
    document.getElementById('gateForm').style.display = "block";
    document.getElementById('pcBadge').innerText = `💻 WORKSTATION PC-${targetPC}`;

    const lrnInput = document.getElementById('lrn');
    lrnInput.focus();
    
    lrnInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') processAuth('LOGIN');
    });

    if (localStorage.getItem(`active_session_${targetPC}`) === 'true') { 
        launchDashboard(true); 
    }
}

function switchView(hideId, showId) {
    const hideEl = document.getElementById(hideId);
    const showEl = document.getElementById(showId);
    
    hideEl.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-10px)' }
    ], { duration: 250, easing: 'ease-in' }).onfinish = () => {
        hideEl.style.display = "none";
        showEl.style.display = "block";
        showEl.animate([
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 300, easing: 'ease-out' });
    };
}

function launchDashboard(immediate) {
    if (immediate) {
        document.getElementById('gateForm').style.display = "none";
        document.getElementById('gateDashboard').style.display = "block";
    } else {
        switchView('gateForm', 'gateDashboard');
    }
    
    document.getElementById('usrName').innerText = localStorage.getItem(`session_user_${targetPC}`);
    document.getElementById('assignedUnit').innerText = `PC Workstation Stalls #${targetPC}`;
    
    clearInterval(timerRef);
    const startTimestamp = parseInt(localStorage.getItem(`session_start_${targetPC}`), 10);
    timerRef = setInterval(() => {
        const delta = Math.floor((Date.now() - startTimestamp) / 1000);
        const hrs = String(Math.floor(delta / 3600)).padStart(2, '0');
        const mins = String(Math.floor((delta % 3600) / 60)).padStart(2, '0');
        const secs = String(delta % 60).padStart(2, '0');
        document.getElementById('sessionClock').innerText = `${hrs}:${mins}:${secs}`;
    }, 1000);
}

async function processAuth(type) {
    const button = type === 'LOGIN' ? document.querySelector('.btn-primary') : document.querySelector('.btn-danger');
    
    button.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.97)' },
        { transform: 'scale(1)' }
    ], { duration: 150 });

    const inputLRN = document.getElementById('lrn').value.trim();
    if (type === 'LOGIN' && (!inputLRN || inputLRN.length < 12)) { 
        alert('Please supply a valid 12-digit LRN identifier.'); 
        return; 
    }

    if (type === 'LOGIN') {
        let { data: student, error } = await supabase.from('student_roster').select('student_name').eq('lrn', inputLRN).single();
        if (error || !student) { 
            document.getElementById('mainCard').animate([
                { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }
            ], { duration: 250 });
            alert('Access Refused: LRN record does not exist.'); 
            return; 
        }

        let { error: lockErr } = await supabase.from('active_sessions').update({ student_id: inputLRN, student_name: student.student_name, time_in: new Date() }).eq('pc_number', targetPC);
        
        if(!lockErr) {
            localStorage.setItem(`active_session_${targetPC}`, 'true');
            localStorage.setItem(`session_user_${targetPC}`, student.student_name);
            localStorage.setItem(`session_lrn_${targetPC}`, inputLRN);
            localStorage.setItem(`session_start_${targetPC}`, Date.now().toString());
            launchDashboard(false);
        }
    } else {
        let { error: releaseErr } = await supabase.from('active_sessions').update({ student_id: null, student_name: null, time_in: null }).eq('pc_number', targetPC);
        if(!releaseErr) {
            const dash = document.getElementById('gateDashboard');
            dash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).onfinish = () => {
                localStorage.clear();
                window.location.reload();
            };
        }
    }
}
