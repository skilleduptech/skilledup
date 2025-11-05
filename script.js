// script.js

/// SkilledUp Form Integration with Google Sheets
// const scriptURL = 'AKfycbydxue0DgTQgWbmNakAqkMW5QjT6WKTQtBFbmUsqq0Y_9HcbkjtoQAOWzjyAq2jHi4g';
const scriptURL = 'https://script.google.com/macros/s/AKfycbyGDvSI68_3hv6PIAbqj5ebsl5wO53mq64hT08W_0WU89Np2Y0wxTHEnBbdUwNkL244tw/exec';  // Your GAS URL

const form = document.getElementById('dataForm');
const status = document.getElementById('formError');  // Using formError for messages
const submitBtn = document.getElementById('submitBtn');  // <-- ADD THIS: Declare submitBtn
const getOtpText = document.getElementById('getOtpText');
const otpGroup = document.getElementById('otpGroup');
const otpInput = document.getElementById('otpInput');
const mobileInput = document.getElementById('mobile');
const otpSentText = document.getElementById('otpSentText');
const otpStatus = document.getElementById('otpStatus');
const nameInput = document.getElementById('name');  // <-- FIXED: Use getElementById since id exists
const emailInput = document.getElementById('email');  // <-- FIXED: Use getElementById since id exists
const agreeCheck = document.getElementById('agreeCheck');  // <-- ADD IF NEEDED: For checkbox validation

let otpSent = false;
let otpVerified = false;
let otpCooldown = false;

document.addEventListener("DOMContentLoaded", () => {
  if (!form || !submitBtn) {
    console.error('Form or submit button not found!');
    return;
  }

  // Show "Get OTP" text dynamically inside mobile input box
  mobileInput.addEventListener("input", () => {
    const mobileValue = mobileInput.value.trim();

    // Show "Get OTP" only when exactly 10 digits are entered
    if (/^\d{10}$/.test(mobileValue)) {
      getOtpText.style.display = "block";
    } else {
      getOtpText.style.display = "none";
      otpGroup.style.display = "none";
      otpInput.value = "";
      otpStatus.style.display = "none";
      otpInput.disabled = false;
      otpInput.style.backgroundColor = "#333";
      otpInput.style.borderColor = "#ccc";
    }
  });

  // Phase 1: Get OTP (beside mobile) - Check name & email before sending
  getOtpText.addEventListener("click", async (e) => {
    e.preventDefault();

    // Check name and email are present and not empty
    if (!nameInput.value.trim()) {
      showError("Please enter your name.");
      return;
    }
    if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
      showError("Please enter a valid email.");
      return;
    }

    if (!mobileInput.value || mobileInput.value.length !== 10) {
      showError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (otpCooldown) return; // prevent multiple clicks

    showStatus("Sending OTP...", "#00ff00");

    const otpFormData = new URLSearchParams();
    otpFormData.append('mobile', mobileInput.value);
    otpFormData.append('action', 'send_otp');

    try {
      const res = await fetch(scriptURL, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: otpFormData
      });
      const rawText = await res.text();
      const result = JSON.parse(rawText);

      if (result.status === 'success') {
        otpSent = true;
        otpGroup.style.display = 'block';
        getOtpText.style.display = "none";
        otpSentText.style.display = "block";
        showStatus("OTP sent successfully! Please enter it below.", "#070707ea");

        // Optional cooldown (60s, no visible timer)
        otpCooldown = true;
        setTimeout(() => { otpCooldown = false; }, 60000);
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      showError(`OTP Send Failed: ${err.message}`);
    }
  });

  // Phase 2: Verify OTP (unlocks Submit) - Auto verify on 6 digits
  otpInput.addEventListener("input", async () => {
    if (otpInput.value.length !== 6) return;

    showStatus("Verifying OTP...", "#00ff00");

    const verifyFormData = new URLSearchParams();
    verifyFormData.append('mobile', mobileInput.value);
    verifyFormData.append('otp', otpInput.value);
    verifyFormData.append('action', 'verify');

    try {
      const res = await fetch(scriptURL, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyFormData
      });
      const rawText = await res.text();
      const result = JSON.parse(rawText);

      if (result.status === 'success') {
        otpVerified = true;
        // Keep textbox visible but disable it
        otpInput.disabled = true;
        otpInput.readOnly = true;
        otpInput.value = "OTP Verified";
        otpInput.style.backgroundColor = "#000000f0";
        otpInput.style.borderColor = "#28a745";
        otpStatus.style.display = "block";
        showStatus();
        // <-- FIXED: Enable submit button here
        submitBtn.disabled = false;
        submitBtn.classList.add('active');
      } else {
        showError(`Error: ${result.message}`);
        otpInput.value = "";
      }
    } catch (err) {
      console.error(err);
      showError(`Verification Failed: ${err.message}`);
      otpInput.value = "";
    }
  });

  // Phase 3: Submit (full data after verify)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Optional: Check checkbox if required
    if (agreeCheck && !agreeCheck.checked) {
      showError("Please agree to the terms.");
      return;
    }
    
    if (!otpVerified) {
      showError("Please verify OTP first.");
      return;
    }

    showStatus("Submitting Data...", "#00ff00");

    const formData = new URLSearchParams();
    formData.append('name', nameInput.value);  // Use nameInput for consistency
    formData.append('email', emailInput.value);
    formData.append('mobile', mobileInput.value);
    formData.append('course', form.course.value || '');  // Safe access
    formData.append('city', form.city.value || '');
    formData.append('background', form.background.value || '');
    formData.append('mode', form.mode.value || '');
    formData.append('action', 'submit_data');

    console.log('Submitting full data');

    try {
      const res = await fetch(scriptURL, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      console.log('Raw Submit Response:', rawText);

      let result;
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Server returned invalid response');
      }

      console.log('Parsed Submit Response:', result);

      if (result.status === 'success') {
        submitBtn.innerHTML = `${result.message} Redirecting...`;
        submitBtn.style.backgroundColor = "#28a745";  // Green background for success
        submitBtn.style.color = "white";
        submitBtn.disabled = true;
        showStatus(`${result.message} Redirecting...`, "#00ff00");
        form.reset();
        otpSent = false;
        otpVerified = false;
        otpGroup.style.display = 'none';
        getOtpText.style.display = "none";
        otpSentText.style.display = "none";
        otpStatus.style.display = "none";
        otpInput.disabled = false;
        otpInput.readOnly = false;
        otpInput.value = "";
        otpInput.style.backgroundColor = "#333";
        otpInput.style.borderColor = "#ccc";
        // <-- FIXED: Disable submit button after success
        submitBtn.disabled = true;
        submitBtn.classList.remove('active');
        // Auto-redirect after 1.5s
        setTimeout(() => {
          window.location.href = 'https://skilledup.tech/category-list.php?c=11&t=0';
        }, 1500);
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error('Submit Error:', err);
      showError(`Submission Failed: ${err.message}`);
    }
  });

  // Helper functions for status/error display
  function showStatus(message, color) {
    status.style.display = "block";
    status.style.color = color;
    status.textContent = message;
  }

  function showError(message) {
    showStatus(message, "#ff4444");
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
// Scroll animations
function observeElements() {
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll smoothly to form when any "Buy" button is clicked
function goToForm() {
    document.getElementById("Data").scrollIntoView({ behavior: "smooth" });
}

// Testimonials carousel
let currentSlide = 0;
const totalSlides = 10;
const slidesToShow = window.innerWidth <= 768 ? 1 : 3;

function moveCarousel(direction) {
    const track = document.getElementById('testimonialsTrack');
    const cardWidth = 320; // 300px + 20px gap
    
    currentSlide += direction;
    
    if (currentSlide < 0) {
        currentSlide = totalSlides - slidesToShow;
    } else if (currentSlide > totalSlides - slidesToShow) {
        currentSlide = 0;
    }
    
    const translateX = -currentSlide * cardWidth;
    track.style.transform = `translateX(${translateX}px)`;
}

// Auto-play carousel
function autoPlayCarousel() {
    setInterval(() => {
        moveCarousel(1);
    }, 4000);
}

// Download functions
function downloadSample() {
    // Simulate certificate download
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Sample Certificate - SkilledUp.Tech';
    link.download = 'SkilledUp_Tech_Sample_Certificate.txt';
    link.click();
    
    // Show notification
    showNotification('Sample certificate download started!');
}

function downloadPortfolioGuide() {
    // Simulate portfolio guide download
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Portfolio Building Guide - SkilledUp.Tech\n\n10 Steps to Build Your Data Science Portfolio';
    link.download = 'Portfolio_Building_Guide.txt';
    link.click();
    
    // Show notification
    showNotification('Portfolio guide download started!');
}

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #00C2A8, #1E9BF0);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// LinkedIn function
function openLinkedIn(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    observeElements();
    autoPlayCarousel();
    
    // Duplicate testimonials for infinite loop
    const track = document.getElementById("testimonialsTrack");
    if (track) {
        track.innerHTML += track.innerHTML;
    }
    
    // Handle window resize for carousel
    window.addEventListener('resize', () => {
        const track = document.getElementById('testimonialsTrack');
        if (track) {
            track.style.transform = 'translateX(0)';
            currentSlide = 0;
        }
    });
});

function goToForm() {
    document.getElementById('Data').scrollIntoView({ behavior: 'smooth' });
}
