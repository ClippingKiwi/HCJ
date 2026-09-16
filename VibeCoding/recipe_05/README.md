# 🚀 Smart QR - URL to QR Code Converter Web Application

> **Smart QR**은 웹사이트 주소(URL)를 입력하면 화면 정중앙에 고화질 QR코드를 즉시 생성하고, 클릭 한 번으로 고해상도 JPG 파일로 다운로드할 수 있는 모던 인터랙티브 웹 애플리케이션입니다.

---

## 📌 주요 특징 및 기능 (Key Features)

1. **세련된 헤더 & 브랜드 아이덴티티**
   - **화면 좌상단**: 전용 로고 심볼(`qr_symbol.png`) 및 단정한 화이트 텍스트의 `QR Creator` 브랜드명 배치
   - **화면 우상단**: 모던 타이포그래피로 구현된 사이트 타이틀 `Smart QR`
   - **자연스러운 올-네이비 그라데이션**: 딥 미드나잇 네이비에서 로열 네이비로 이어지는 부드러운 톤온톤 헤더 및 네온 디바이더 라인

2. **몰입감 넘치는 네온 사이버 무드 배경**
   - 시안(Cyan), 마젠타(Magenta), 사파이어(Sapphire) 3중 앰비언트 네온 펄스 애니메이션
   - 깊이감을 더하는 사이버네틱 그리드 및 화면 하단 네온 레이저 호라이즌 라인
   - 메탈릭 실버(Metallic Silver) 그라데이션으로 통일된 중앙 메인 타이틀 및 서브카피

3. **부드러운 상태 전환 애니메이션 (Dynamic Motion)**
   - 초기 접속 시 시선이 집중되는 중앙 URL 입력창 배치
   - URL 입력 후 확인(또는 `Enter`) 시, 입력창이 부드러운 스프링 모션(`cubic-bezier`)으로 하단 독(Dock)으로 슬라이드 다운
   - 동시에 화면 정중앙에 듀얼 네온 헤일로(Dual Neon Halo)가 적용된 QR 코드 카드가 팝업 등장

4. **1-클릭 고화질 JPG 다운로드**
   - 생성된 QR코드 카드 클릭 시, 오프스크린 캔버스를 통해 **600px+ 고화질 `.jpg` 이미지**로 자동 렌더링 및 다운로드
   - 투명 배경으로 인한 검은색 깨짐을 방지하는 **순백색 안전 배경(Safe Quiet Zone)** 및 URL/브랜드 워터마크 자동 삽입
   - 다운로드 완료 시 화면 상단에 사이버 네온 스타일의 토스트 안내 팝업 노출

---

## 📂 프로젝트 파일 구조 (Project Structure)

```text
recipe_05/
├── index.html        # 시맨틱 구조, 헤더/입력독/QR스테이지 및 메타 태그
├── style.css         # 네온 테마, 올-네이비 헤더, 글래스모피즘, 트랜지션 애니메이션
├── app.js            # URL 유효성 검사, 상태 모션, 단일 QR 생성 및 JPG 내보내기 로직
├── qrcode.min.js     # 오프라인 환경에서도 독립 구동되는 경량 QR 코드 라이브러리
├── qr_symbol.png     # 좌상단 브랜드 심볼 아이콘
└── README.md         # 프로젝트 문서 및 사용 안내서
```

---

## 🛠 기술 스택 (Tech Stack)

- **Markup**: HTML5 (시맨틱 태그, 접근성 ARIA 속성)
- **Styling**: Vanilla CSS3 (CSS Variables, Flexbox/Grid, Glassmorphism, Keyframe Animations)
- **Scripting**: Vanilla JavaScript (ES6+, Canvas API, Blob & DataURL)
- **Library**: `qrcode.js` (Canvas 기반 QR 코드 생성 엔진)
- **Typography**: Google Fonts ([Outfit](https://fonts.google.com/specimen/Outfit), [Pretendard](https://github.com/orioncactus/pretendard))

---

## 💻 실행 및 사용 방법 (How to Run)

본 프로젝트는 별도의 빌드 과정이나 외부 서버 설치 없이 순수 웹 표준 기술로 제작되어 브라우저에서 즉시 실행할 수 있습니다.

1. **실행 방법**:
   - `recipe_05` 폴더 내의 [`index.html`](./index.html) 파일을 더블 클릭하여 웹 브라우저(Chrome, Edge, Safari 등)에서 엽니다.

2. **사용 순서**:
   1. 화면 중앙의 입력창에 변환하고자 하는 웹사이트 주소(예: `naver.com`, `https://google.com`)를 입력합니다.
   2. **[확인]** 버튼을 클릭하거나 키보드의 **Enter** 키를 누릅니다.
   3. 입력창이 화면 하단으로 내려가고 화면 정중앙에 고화질 QR코드가 생성됩니다.
   4. 정중앙의 **QR코드 카드를 클릭**하면 고화질 JPG 파일(`smart_qr_...jpg`)이 즉시 다운로드됩니다.
   5. 하단으로 이동한 입력창에서 다른 URL을 입력하여 언제든지 새로운 QR코드를 연속 생성할 수 있습니다.

---

## 📱 반응형 지원 (Responsive Design)

- 데스크톱 모니터뿐만 아니라 태블릿, 모바일 기기 화면 폭에 맞춰 최적화된 레이아웃과 폰트 크기, 터치 패딩을 지원합니다.
