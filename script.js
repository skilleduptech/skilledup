// script.js

/// SkilledUp Form Integration with Google Sheets
// const scriptURL = 'AKfycbydxue0DgTQgWbmNakAqkMW5QjT6WKTQtBFbmUsqq0Y_9HcbkjtoQAOWzjyAq2jHi4g';
const scriptURL = 'https://script.google.com/macros/s/AKfycbyGDvSI68_3hv6PIAbqj5ebsl5wO53mq64hT08W_0WU89Np2Y0wxTHEnBbdUwNkL244tw/exec';  // Your GAS URL

const form = document.getElementById('dataForm');
const status = document.getElementById('status');
const getOtpBtn = document.getElementById('getOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const submitBtn = document.getElementById('submitBtn');
const otpGroup = document.querySelector('.otp-group');
const otpInput = document.getElementById('otpInput');
const actionInput = document.getElementById('actionInput');
const mobileInput = document.getElementById('mobile');

let otpSent = false;
let otpVerified = false;

document.addEventListener("DOMContentLoaded", () => {
  if (!form) {
    console.error('Form not found!');
    return;
  }

  // Phase 1: Get OTP (beside mobile)
  getOtpBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!mobileInput.value || mobileInput.value.length < 10) {
      status.style.color = "#ff4444";
      status.textContent = "Please enter a valid 10-digit mobile number.";
      return;
    }

    status.style.color = "#00ff00";
    status.textContent = "Sending OTP...";

    const otpFormData = new URLSearchParams();
    otpFormData.append('mobile', mobileInput.value);
    otpFormData.append('action', 'send_otp');

    console.log('Sending OTP for:', { mobile: mobileInput.value });

    try {
      const res = await fetch(scriptURL, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: otpFormData
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      console.log('Raw OTP Response:', rawText);

      let result;
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Server returned invalid response');
      }

      console.log('Parsed OTP Response:', result);

      if (result.status === 'success') {
        otpSent = true;
        otpGroup.style.display = 'flex';  // Show OTP row BELOW mobile
        getOtpBtn.style.display = 'none';
        status.style.color = "#00ff00";
        status.textContent = "OTP sent! Enter it below to verify.";
      } else {
        status.style.color = "#ff4444";
        status.textContent = `Error: ${result.message}`;
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      status.style.color = "#ff4444";
      status.textContent = `OTP Send Failed: ${err.message}`;
    }
  });

  // Phase 2: Verify OTP (unlocks Submit)
  verifyOtpBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!otpInput.value || otpInput.value.length !== 6) {
      status.style.color = "#ff4444";
      status.textContent = "Please enter a valid 6-digit OTP.";
      return;
    }

    status.style.color = "#00ff00";
    status.textContent = "Verifying OTP...";

    const verifyFormData = new URLSearchParams();
    verifyFormData.append('mobile', mobileInput.value);
    verifyFormData.append('otp', otpInput.value);
    verifyFormData.append('action', 'verify');

    console.log('Verifying OTP for:', { mobile: mobileInput.value, otp: otpInput.value });

    try {
      const res = await fetch(scriptURL, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyFormData
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      console.log('Raw Verify Response:', rawText);

      let result;
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Server returned invalid response');
      }

      console.log('Parsed Verify Response:', result);

      if (result.status === 'success') {
        otpVerified = true;
        otpGroup.style.display = 'none';  // Hide OTP row after verify
        submitBtn.disabled = false;  // Unlock Submit
        submitBtn.classList.add('active');  // Add class for green color
        status.style.color = "#00ff00";
        status.textContent = "OTP verified! Now fill the form and submit.";
      } else {
        status.style.color = "#ff4444";
        status.textContent = `Error: ${result.message}`;
        otpInput.value = '';
      }
    } catch (err) {
      console.error('Verify Error:', err);
      status.style.color = "#ff4444";
      status.textContent = `Verification Failed: ${err.message}`;
      otpInput.value = '';
    }
  });

  // Phase 3: Submit (full data after verify)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      status.style.color = "#ff4444";
      status.textContent = "Please verify OTP first.";
      return;
    }

    status.style.color = "#00ff00";
    status.textContent = "Submitting Data...";

    const formData = new URLSearchParams();
    formData.append('name', form.name.value);
    formData.append('email', form.email.value);
    formData.append('mobile', mobileInput.value);
    formData.append('course', form.course.value);
    formData.append('city', form.city.value);
    formData.append('background', form.background.value);
    formData.append('mode', form.mode.value);
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
        status.style.color = "#00ff00";
        status.textContent = `${result.message} Redirecting...`;
        form.reset();
        otpSent = false;
        otpVerified = false;
        getOtpBtn.style.display = 'block';
        otpGroup.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.classList.remove('active');
        // Auto-redirect after 1.5s
        setTimeout(() => {
          window.location.href = 'https://skilledup.tech/category-list.php?c=11&t=0';
        }, 1500);
      } else {
        status.style.color = "#ff4444";
        status.textContent = `Error: ${result.message}`;
      }
    } catch (err) {
      console.error('Submit Error:', err);
      status.style.color = "#ff4444";
      status.textContent = `Submission Failed: ${err.message}`;
    }
  });
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