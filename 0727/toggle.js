document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================
     1. 다크/라이트 테마 토글 로직 (다크 모드 기본)
  =================================================== */
  const toggleBtn = document.getElementById('theme-toggle');
  const toggleIcon = toggleBtn ? toggleBtn.querySelector('.toggle-icon') : null;
  const toggleText = toggleBtn ? toggleBtn.querySelector('.toggle-text') : null;

  // 저장된 테마 불러오기
  const savedTheme = localStorage.getItem('theme');

  // 핵심 수정: 사용자가 명시적으로 'light'를 선택해서 저장한 경우에만 라이트 모드 실행
  // 그 외(방문이 처음이거나 'dark'로 저장된 경우)에는 모두 기본인 다크 모드 적용
  if (savedTheme === 'light') {
    enableLightMode();
  } else {
    enableDarkMode();
  }

  // 버튼 클릭 이벤트
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isLightMode = document.body.classList.contains('light-mode');
      
      if (isLightMode) {
        enableDarkMode();
        localStorage.setItem('theme', 'dark');
      } else {
        enableLightMode();
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // 라이트 모드 활성화
  function enableLightMode() {
    document.body.classList.add('light-mode');
    if (toggleIcon) toggleIcon.textContent = '☀️';
    if (toggleText) toggleText.textContent = '낮 테마';
  }

  // 다크 모드 활성화
  function enableDarkMode() {
    document.body.classList.remove('light-mode');
    if (toggleIcon) toggleIcon.textContent = '🌙';
    if (toggleText) toggleText.textContent = '밤 테마';
  }

  /* ===================================================
     2. 유튜브 파사드 (클릭 시 비디오 로드) 로직
  =================================================== */
  const facades = document.querySelectorAll('.youtube-facade');

  facades.forEach((facade) => {
    facade.addEventListener('click', function () {
      const videoId = this.dataset.videoId;

      if (!videoId) return;

      // 동적으로 iframe 생성 (autoplay=1로 클릭 즉시 재생)
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1`);
      iframe.setAttribute('title', 'YouTube video player');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', 'true');

      // 내부 썸네일과 버튼을 지우고 iframe으로 교체
      this.innerHTML = '';
      this.appendChild(iframe);
      this.classList.remove('youtube-facade');
    });
  });
});