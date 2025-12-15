let selectedAccountType = 'buyer';
let currentStep = 1;
let map = null;
let marker = null;
let selectedLocation = null;

const appState = {
    user: null,
    currentSection: 'homeSection'
};

const SESSION_KEY = 'appSession';

// Supabase client
const supabaseUrl = 'https://xglkvltefksjhvjmmjfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbGt2bHRlZmtzamh2am1tamZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzUzNTYsImV4cCI6MjA4MTM1MTM1Nn0.quAdd7OrbppeVoaMSw_3MipOwrcgXCrU9SXdTLEEiU8';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Account type selection
document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        
        // Update active button
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        selectedAccountType = type;
    });
});

// Handle account type selection and move to step 2
document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(() => {
            goToStep(2);
        }, 300);
    });
});

// Sign up form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        accountType: selectedAccountType,
        username: document.getElementById('username').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        countryCode: '+966',
        city: document.getElementById('city').value
    };
    
    // Validate form
    if (!formData.username || !formData.phone || !formData.city) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    // Validate phone number
    if (formData.phone.length < 9) {
        alert('يرجى إدخال رقم هاتف صحيح');
        return;
    }
    
    // Save to Supabase
    try {
        const { error } = await supabase.from('registrations').insert([{
            account_type: formData.accountType,
            username: formData.username,
            phone: formData.phone,
            country_code: formData.countryCode,
            city: formData.city
        }]);

        if (error) {
            console.error('Supabase insert error:', error);
            alert('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
            return;
        }
    } catch (err) {
        console.error('Supabase error:', err);
        alert('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
        return;
    }
    
    // Move to location step
    goToStep(3);
    persistSession({
        username: formData.username,
        phone: formData.phone,
        city: formData.city,
        accountType: formData.accountType
    });
    populateProfile();
});

// Register button (final step)
document.getElementById('registerBtn').addEventListener('click', () => {
    if (!selectedLocation) {
        alert('يرجى تحديد موقعك على الخريطة');
        return;
    }
    
    const locationInfoEl = document.getElementById('locationInfo');
    const locationAddress = locationInfoEl ? locationInfoEl.textContent : 'الموقع المحدد';
    
    const formData = {
        accountType: selectedAccountType,
        username: document.getElementById('username').value,
        phone: document.getElementById('phone').value,
        countryCode: '+966',
        city: document.getElementById('city').value,
        location: {
            address: locationAddress,
            lat: selectedLocation.lat(),
            lng: selectedLocation.lng()
        }
    };
    
    console.log('Final Registration Data:', formData);
    alert('تم التسجيل بنجاح!');
    launchAppShell();
    
    // Here you would typically send the data to your backend
    // After successful registration, you might redirect to login or dashboard
});

// Step navigation function
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.registration-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    
    // Initialize map when step 3 is shown
    if (step === 3) {
        setTimeout(() => {
            initMap();
        }, 100);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize Google Maps
function initMap() {
    // Default location: Riyadh, Saudi Arabia
    const defaultLocation = { lat: 24.7136, lng: 46.6753 };
    
    // Create map
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Create marker
    marker = new google.maps.Marker({
        map: map,
        position: defaultLocation,
        draggable: true,
        animation: google.maps.Animation.DROP
    });
    
    // Get location on marker drag
    marker.addListener('dragend', function() {
        updateLocationInfo(marker.getPosition());
    });
    
    // Get location on map click
    map.addListener('click', function(event) {
        marker.setPosition(event.latLng);
        updateLocationInfo(event.latLng);
    });
    
    // Get initial location info
    updateLocationInfo(defaultLocation);
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                marker.setPosition(userLocation);
                updateLocationInfo(userLocation);
            },
            function(error) {
                console.log('Geolocation error:', error);
                // Use default location
            }
        );
    }
}

// Update location information
function updateLocationInfo(location) {
    selectedLocation = location;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: location }, function(results, status) {
        if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            const locationInfoEl = document.getElementById('locationInfo');
            if (locationInfoEl) {
                locationInfoEl.textContent = address;
                locationInfoEl.style.display = 'block';
            }
        }
    });
}

// Initialize - show step 1
goToStep(1);
restoreSession();
hideSplashSoon();

// App navigation handlers
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        setActiveSection(target);
    });
});

document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
        const action = card.getAttribute('data-action');
        if (action === 'newRequest') setActiveSection('requestSection');
        if (action === 'offers') setActiveSection('offersSection');
        if (action === 'profile') setActiveSection('profileSection');
    });
});

// Quick action buttons
document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'newRequest') setActiveSection('requestSection');
        if (action === 'offers') setActiveSection('offersSection');
        if (action === 'profile') setActiveSection('profileSection');
    });
});

// Brand selector
(function initBrandSelector() {
    const tiles = Array.from(document.querySelectorAll('.brand-tile'));
    const hidden = document.getElementById('reqBrand');
    if (!tiles.length || !hidden) return;
    tiles.forEach(tile => {
        tile.addEventListener('click', () => {
            tiles.forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');
            hidden.value = tile.dataset.brand;
        });
    });
})();

// Request flow
(function initRequestFlow() {
    const steps = ['brand', 'year', 'details'];
    const stepElems = {
        brand: document.getElementById('stepBrand'),
        year: document.getElementById('stepYear'),
        details: document.getElementById('stepDetails')
    };

    function setStep(step) {
        steps.forEach(s => {
            if (stepElems[s]) stepElems[s].classList.toggle('active', s === step);
            const indicator = document.querySelector(`.stepper .step[data-step="${s}"]`);
            if (indicator) indicator.classList.toggle('active', s === step);
        });
        setActiveSection('requestSection');
        updateSummary();
    }

    const brandNext = document.getElementById('brandNext');
    if (brandNext) {
        brandNext.addEventListener('click', () => {
            const brand = document.getElementById('reqBrand').value;
            if (!brand) {
                showAppMessage('يرجى اختيار وكالة السيارة');
                return;
            }
            setStep('year');
        });
    }

    const yearNext = document.getElementById('yearNext');
    if (yearNext) {
        yearNext.addEventListener('click', () => {
            const year = document.getElementById('reqYear').value;
            if (!year) {
                showAppMessage('يرجى اختيار السنة');
                return;
            }
            setStep('details');
        });
    }

    document.querySelectorAll('.ghost-btn[data-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            const back = btn.getAttribute('data-back');
            if (steps.includes(back)) setStep(back);
        });
    });

    const submitRequestBtn = document.getElementById('submitRequest');
    if (submitRequestBtn) {
        submitRequestBtn.addEventListener('click', () => {
            const category = document.getElementById('reqCategory').value;
            const brand = document.getElementById('reqBrand').value;
            const year = document.getElementById('reqYear').value;
            const part = document.getElementById('reqPartName').value.trim();
            const notes = document.getElementById('reqNotes').value;
            const agree = document.getElementById('reqAgree').checked;

            if (!brand) return showAppMessage('يرجى اختيار وكالة السيارة');
            if (!year) return showAppMessage('يرجى اختيار السنة');
            if (!category) return showAppMessage('يرجى اختيار الفئة');
            if (!part) return showAppMessage('يرجى إدخال اسم القطعة');
            if (!agree) return showAppMessage('يرجى الموافقة على الشروط والأحكام');

            console.log('Request:', { brand, year, category, part, notes });
            openPledge();
        });
    }
})();

function showAppMessage(msg) {
    const modal = document.getElementById('appMessageModal');
    const text = document.getElementById('appMessageText');
    if (text) text.textContent = msg || '';
    if (modal) modal.classList.add('active');
}

function closeAppMessage() {
    const modal = document.getElementById('appMessageModal');
    if (modal) modal.classList.remove('active');
}

function updateSummary() {
    const brand = document.getElementById('reqBrand')?.value || '';
    const year = document.getElementById('reqYear')?.value || '';
    const summaryCar = document.getElementById('summaryCar');
    if (summaryCar) {
        const brandText = brand ? brand.toUpperCase() : '—';
        summaryCar.textContent = year ? `${brandText} ، ${year}` : brandText;
    }
}

function openPledge() {
    const modal = document.getElementById('pledgeModal');
    if (modal) modal.classList.add('active');
}

function closePledge() {
    const modal = document.getElementById('pledgeModal');
    if (modal) modal.classList.remove('active');
}

function confirmPledge() {
    closePledge();
    openSuccess();
}

function openSuccess() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.add('active');
}

function closeSuccess() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('active');
}

function launchAppShell() {
    document.querySelector('.registration-wrapper').style.display = 'none';
    const appShell = document.getElementById('appShell');
    appShell.classList.add('active');
    setActiveSection('homeSection');
}

function setActiveSection(sectionId) {
    appState.currentSection = sectionId;
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-target') === sectionId);
    });

    const titleMap = {
        homeSection: 'الرئيسية',
        requestSection: 'معلومات الطلب',
        offersSection: 'العروض',
        profileSection: 'حسابي'
    };
    const title = titleMap[sectionId] || 'الرئيسية';
    document.getElementById('appTitle').textContent = title;
}

function persistSession(user) {
    appState.user = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function restoreSession() {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return;
        const user = JSON.parse(stored);
        if (!user || !user.username) return;
        appState.user = user;
        launchAppShell();
        populateProfile();
    } catch (e) {
        console.warn('Failed to restore session', e);
    }
}

function populateProfile() {
    const info = document.getElementById('profileInfo');
    const user = appState.user;
    const nameEl = document.getElementById('profileName');
    const phoneEl = document.getElementById('profilePhone');
    const cityEl = document.getElementById('profileCity');
    const roleEl = document.getElementById('profileRole');

    if (info) {
        info.textContent = user ? '' : 'لم يتم تحميل البيانات بعد.';
    }

    if (!user) {
        if (nameEl) nameEl.textContent = '—';
        if (phoneEl) phoneEl.textContent = '—';
        if (cityEl) cityEl.textContent = '—';
        if (roleEl) roleEl.textContent = '—';
        return;
    }

    if (nameEl) nameEl.textContent = user.username || '—';
    if (phoneEl) phoneEl.textContent = user.phone ? `+966 ${user.phone}` : '—';
    if (cityEl) cityEl.textContent = user.city || '—';
    if (roleEl) roleEl.textContent = user.accountType === 'shipper' ? 'كتشاليح' : 'مشتري';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    appState.user = null;
    window.location.reload();
});

const deleteBtn = document.getElementById('deleteAccountBtn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        if (!appState.user || !appState.user.phone) {
            alert('لا يوجد حساب مسجل لحذفه.');
            return;
        }
        const confirmed = window.confirm('هل أنت متأكد من حذف الحساب؟ لا يمكن التراجع عن هذا الإجراء.');
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('phone', appState.user.phone);

            if (error) {
                console.error('Supabase delete error:', error);
                alert('تعذر حذف الحساب. حاول مرة أخرى.');
                return;
            }

            localStorage.removeItem(SESSION_KEY);
            appState.user = null;
            alert('تم حذف الحساب.');
            window.location.reload();
        } catch (err) {
            console.error('Delete account error:', err);
            alert('حدث خطأ أثناء الحذف. حاول مرة أخرى.');
        }
    });
}

// Add input validation feedback
document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('blur', () => {
        if (input.checkValidity()) {
            input.style.borderColor = '#27ae60';
        } else if (input.value !== '' || (input.tagName === 'SELECT' && input.value !== '')) {
            input.style.borderColor = '#e74c3c';
        }
    });
    
    input.addEventListener('input', () => {
        if (input.value === '' || (input.tagName === 'SELECT' && input.value === '')) {
            input.style.borderColor = '#e0e0e0';
        }
    });
});

// Phone number formatting (Saudi Arabia)
document.getElementById('phone').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 9) {
        value = value.slice(0, 9);
    }
    e.target.value = value;
});

// Login modal
function openLogin(e) {
    if (e) e.preventDefault();
    document.getElementById('loginModal').classList.add('active');
    const phoneInput = document.getElementById('loginPhone');
    if (phoneInput) phoneInput.focus();
}

function closeLogin() {
    document.getElementById('loginModal').classList.remove('active');
    const error = document.getElementById('loginError');
    if (error) error.textContent = '';
    const form = document.getElementById('loginForm');
    if (form) form.reset();
}

document.getElementById('loginPhone').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 9) value = value.slice(0, 9);
    e.target.value = value;
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const error = document.getElementById('loginError');
    if (error) error.textContent = '';

    if (phone.length < 9) {
        if (error) error.textContent = 'يرجى إدخال رقم صحيح';
        return;
    }

    try {
        const { data, error: supaError } = await supabase
            .from('registrations')
            .select('username, phone, city, account_type')
            .eq('phone', phone)
            .limit(1)
            .maybeSingle();

        if (supaError) {
            console.error('Supabase login error:', supaError);
            if (error) error.textContent = 'تعذر التحقق. حاول مرة أخرى.';
            return;
        }

        if (!data) {
            if (error) error.textContent = 'لم يتم العثور على حساب بهذا الرقم.';
            return;
        }

        persistSession({
            username: data.username || '',
            phone: data.phone || phone,
            city: data.city || '',
            accountType: data.account_type || 'buyer'
        });
        populateProfile();
        launchAppShell();
        closeLogin();
    } catch (err) {
        console.error('Login error:', err);
        if (error) error.textContent = 'حدث خطأ. حاول مرة أخرى.';
    }
});

function hideSplashSoon() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    setTimeout(() => {
        splash.classList.add('hidden');
        setTimeout(() => {
            splash.style.display = 'none';
        }, 600);
    }, 900);
}
