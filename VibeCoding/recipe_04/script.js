/* ==========================================================
   드미트리 ♥ 로렐라이 모바일 청첩장 스크립트 (script.js)
   Realtime Countdown, Lightbox, Copy Toast, Petal Particle Canvas
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. D-DAY 실시간 카운트다운 설정 (2027년 6월 5일 오전 11:00 한국 표준시)
  initCountdown();

  // 2. 스크롤 페이드인 리빌 효과
  initScrollReveal();

  // 3. 신랑/신부 연락처 바텀시트 모달
  initContactModal();

  // 4. 마음 전하시는 곳 아코디언
  initAccordion();

  // 5. 클립보드 복사 및 토스트 알림
  initClipboardAndShare();

  // 6. 갤러리 라이트박스 뷰어 & 스와이프 제스처
  initGalleryLightbox();

  // 7. 벚꽃 꽃잎 흩날리는 캔버스 효과
  initPetalCanvas();
});

/* ==========================================================
   1. Realtime Countdown with Dynamic Animation
   ========================================================== */
function initCountdown() {
  // 목표 일시: 2027년 6월 5일 11:00:00 (KST)
  const targetDate = new Date('2027-06-05T11:00:00+09:00').getTime();

  const daysEl = document.getElementById('countdown-days');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');
  const liveTextEl = document.getElementById('live-countdown-text');

  let prevSec = null;
  let prevMin = null;
  let prevHour = null;
  let prevDay = null;

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      if (liveTextEl) liveTextEl.textContent = '드미트리 ♥ 로렐라이의 축복된 결혼식이 시작되었습니다.';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const formattedDays = String(days).padStart(2, '0');
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    // 숫자 변경 시 애니메이션 클래스 부여
    triggerNumberUpdate(daysEl, formattedDays, prevDay);
    triggerNumberUpdate(hoursEl, formattedHours, prevHour);
    triggerNumberUpdate(minutesEl, formattedMinutes, prevMin);
    triggerNumberUpdate(secondsEl, formattedSeconds, prevSec);

    prevDay = formattedDays;
    prevHour = formattedHours;
    prevMin = formattedMinutes;
    prevSec = formattedSeconds;

    if (liveTextEl) {
      liveTextEl.textContent = `결혼식까지 ${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남았습니다.`;
    }
  }

  function triggerNumberUpdate(el, newVal, oldVal) {
    if (!el) return;
    if (newVal !== oldVal) {
      el.textContent = newVal;
      el.classList.remove('tick-animate');
      // Reflow 강제하여 애니메이션 재실행
      void el.offsetWidth;
      el.classList.add('tick-animate');
    }
  }

  // 즉시 1회 실행 후 1초 간격 반복
  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================
   2. Scroll Reveal Interaction
   ========================================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ==========================================================
   3. Contact Modal (Bottom Sheet)
   ========================================================== */
function initContactModal() {
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const groomBtn = document.getElementById('contact-groom-btn');
  const brideBtn = document.getElementById('contact-bride-btn');

  const targetTitle = document.getElementById('modal-target-title');
  const targetDesc = document.getElementById('modal-target-desc');
  const callBtn = document.getElementById('modal-call-btn');
  const smsBtn = document.getElementById('modal-sms-btn');

  const contacts = {
    groom: {
      title: '신랑 드미트리에게 연락하기',
      desc: '신랑에게 따뜻한 축하와 격려의 인사를 전해주세요.',
      phone: '010-1234-5678'
    },
    bride: {
      title: '신부 로렐라이에게 연락하기',
      desc: '신부에게 다정한 축하와 응원의 인사를 전해주세요.',
      phone: '010-9876-5432'
    }
  };

  function openContact(role) {
    const data = contacts[role];
    if (!data) return;

    targetTitle.textContent = data.title;
    targetDesc.textContent = data.desc;
    callBtn.href = `tel:${data.phone}`;
    smsBtn.href = `sms:${data.phone}`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (groomBtn) groomBtn.addEventListener('click', () => openContact('groom'));
  if (brideBtn) brideBtn.addEventListener('click', () => openContact('bride'));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

/* ==========================================================
   4. Accordion (마음 전하시는 곳)
   ========================================================== */
function initAccordion() {
  const headers = document.querySelectorAll('.accordion-header');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isActive = item.classList.contains('active');

      // 아코디언 토글
      item.classList.toggle('active', !isActive);
    });
  });
}

/* ==========================================================
   5. Clipboard & Share Toast Notification
   ========================================================== */
function initClipboardAndShare() {
  const toastContainer = document.getElementById('toast-container');
  const toastMessage = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');
  let toastTimer = null;

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastText.textContent = message;
    toastMessage.classList.add('show');

    toastTimer = setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 2500);
  }

  // 복사 버튼 이벤트
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-clipboard');
      copyToClipboard(textToCopy, '계좌번호가 복사되었습니다.');
    });
  });

  // 링크 주소 복사 버튼
  const shareLinkBtn = document.getElementById('share-link-btn');
  if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', () => {
      const currentUrl = window.location.href;
      copyToClipboard(currentUrl, '청첩장 주소가 복사되었습니다.');
    });
  }

  // 카카오톡 공유 버튼 (웹 공유 API 연동)
  const shareKakaoBtn = document.getElementById('share-kakao-btn');
  if (shareKakaoBtn) {
    shareKakaoBtn.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: '드미트리 ♥ 로렐라이 결혼합니다',
          text: '저희 두 사람의 새로운 출발을 축복해 주세요. 2027년 6월 5일 나나컨벤션센터',
          url: window.location.href
        }).catch(() => {});
      } else {
        copyToClipboard(window.location.href, '청첩장 주소가 복사되었습니다. 카카오톡에 붙여넣어 공유하세요.');
      }
    });
  }

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(successMsg))
        .catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      showToast('복사에 실패했습니다.');
    }
    document.body.removeChild(tempInput);
  }
}

/* ==========================================================
   6. Gallery Lightbox Viewer with Touch Swipe
   ========================================================== */
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');

  if (!lightbox) return;

  const imageSources = Array.from(galleryItems).map(item => {
    const img = item.querySelector('img');
    return img ? img.getAttribute('src') : '';
  });

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    if (!imageSources[currentIndex]) return;
    lightboxImg.src = imageSources[currentIndex];
    lightboxCounter.textContent = `${currentIndex + 1} / ${imageSources.length}`;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % imageSources.length;
    updateLightboxImage();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
    updateLightboxImage();
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (nextBtn) nextBtn.addEventListener('click', showNext);
  if (prevBtn) prevBtn.addEventListener('click', showPrev);

  // 모달 배경 클릭 시 닫기
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-img-wrap')) {
      closeLightbox();
    }
  });

  // 키보드 방향키 및 ESC 제어
  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });

  // 모바일 터치 스와이프 제스처
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    if (Math.abs(swipeDistance) > 45) {
      if (swipeDistance < 0) {
        showNext(); // 왼쪽 스와이프 -> 다음 사진
      } else {
        showPrev(); // 오른쪽 스와이프 -> 이전 사진
      }
    }
  }
}

/* ==========================================================
   7. Sakura / Cherry Blossom Falling Petal Canvas Effect
   ========================================================== */
function initPetalCanvas() {
  const canvas = document.getElementById('petal-canvas');
  const toggleBtn = document.getElementById('effect-toggle-btn');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let isRunning = true;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // 꽃잎 파티클 개수 (모바일 최적화: 25개)
  const petalCount = 25;
  const petals = [];

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 8; // 8 ~ 16px
      this.speedX = Math.random() * 1.5 - 0.5; // 살짝 우측으로 바람
      this.speedY = Math.random() * 1.2 + 0.8; // 낙하 속도
      this.rotation = Math.random() * 360;
      this.rotSpeed = Math.random() * 2 - 1;
      this.opacity = Math.random() * 0.45 + 0.35; // 0.35 ~ 0.8
      this.flip = Math.random() * 360;
      this.flipSpeed = Math.random() * 2 + 1;
      // 핑크/로즈/샴페인 계열
      const hues = ['#ffd1dc', '#ffe4e1', '#fcd5ce', '#f8edeb'];
      this.color = hues[Math.floor(Math.random() * hues.length)];
    }

    update() {
      this.x += this.speedX + Math.sin(this.flip * 0.02) * 0.5;
      this.y += this.speedY;
      this.rotation += this.rotSpeed;
      this.flip += this.flipSpeed;

      // 화면 벗어나면 상단에서 재스폰
      if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.scale(Math.sin((this.flip * Math.PI) / 180), 1);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      // 우아한 꽃잎 커브 (Bezier curve)
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size * 1.4);
      ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);

      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < petalCount; i++) {
    petals.push(new Petal());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach(p => {
      p.update();
      p.draw();
    });
    if (isRunning) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  // 효과 온/오프 토글 버튼
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isRunning = !isRunning;
      toggleBtn.classList.toggle('disabled', !isRunning);
      if (isRunning) {
        render();
      } else {
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, width, height);
      }
    });
  }
}
