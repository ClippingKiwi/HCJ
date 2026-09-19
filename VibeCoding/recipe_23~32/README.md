# 🧰 MINI APPS

일상에서 자주 쓰는 도구 **10개**를 모아 만든 웹 앱 허브입니다.
설치도 로그인도 필요 없고, 업로드한 파일은 **브라우저 안에서만 처리**되어 서버로 전송되지 않습니다.

---

## ✨ 특징

- **제로 빌드** — 번들러·트랜스파일러 없이 HTML·CSS·JS 원본 파일만으로 동작
- **제로 백엔드** — 모든 연산이 클라이언트에서 처리되므로 파일이 외부로 나가지 않음
- **공통 디자인 시스템** — 단일 `style.css`와 CSS 변수로 10개 앱의 톤을 통일
- **반응형 레이아웃** — 데스크톱 3열 / 태블릿 2열 / 모바일 1열 자동 전환
- **접근성 고려** — 키보드 포커스 트랩, `prefers-reduced-motion` 대응, ARIA 속성 적용

---

## 📁 프로젝트 구조

```
mini-apps/
├── index.html          # 메인 허브 (앱 카드 10개 + 문의하기)
├── style.css           # 전체 공통 스타일시트
├── contact.js          # 문의하기 모달 로직
│
├── fortune.html        + fortune.js
├── counter.html        + counter.js
├── docstat.html        + docstat.js
├── lorem.html          + lorem.js
├── pdfmerge.html       + pdfmerge.js
├── bmi.html            + bmi.js
├── away.html           + away.js
├── pinball.html        + pinball.js
├── summary.html        + summary.js
├── audio.html          + audio.js
│
└── README.md
```

---

## 🚀 실행 방법

### 1. 파일 직접 열기

`index.html`을 브라우저로 열면 바로 사용할 수 있습니다.

### 2. 로컬 서버 실행 (권장)

일부 앱은 `file://` 프로토콜에서 CORS 제약을 받을 수 있어 간단한 서버 실행을 권장합니다.

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

이후 브라우저에서 `http://localhost:8000` 으로 접속하세요.

---

## 📦 앱 목록

| # | 앱 | 파일 | 설명 |
|:--:|---|---|---|
| 1 | 🔮 오늘의 운세 | `fortune.html` | 기본 정보 입력 후 운세 알아보기 |
| 2 | 🔤 글자 수 계산기 | `counter.html` | 텍스트를 입력하면 실시간으로 글자 수를 세어줌 |
| 3 | 📄 문서 분석기 | `docstat.html` | 문서를 업로드하면 글자 수, 단어 수, 이미지 수 등을 분석 |
| 4 | 📝 Lorem Ipsum 생성기 | `lorem.html` | 10~1000글자의 더미 텍스트 즉시 생성 |
| 5 | 📚 PDF 병합기 | `pdfmerge.html` | 여러 PDF 파일을 하나로 합쳐줌 |
| 6 | ⚖️ BMI 계산기 | `bmi.html` | BMI를 계산해주고 목표 체중까지 도달하기 위한 수치를 제공 |
| 7 | 🚪 자리 비움 안내판 | `away.html` | 일정, 복귀 시간, 카운트다운을 화면에 표시해줌 |
| 8 | 🎰 핀볼 이름 추첨기 | `pinball.html` | 구슬이 핀과 범퍼를 튕기며 내려와 당첨자를 뽑는 추첨기 |
| 9 | ✍️ 문서 요약기 | `summary.html` | PDF·DOCX·TXT를 TextRank 알고리즘으로 1~5문장 요점 요약 |
| 10 | 🎧 오디오 편집기 | `audio.html` | MP3·WAV 구간 자르기, 볼륨 조절, 포맷 변환 |

---

## 📮 문의하기

메인 허브 하단의 **Coming Soon** 카드에서 문의를 보낼 수 있습니다.

- 문의 유형을 **버그 제보 / 앱 제안 / 기타 문의** 중에서 선택
- 선택한 유형에 따라 제목 접두어(`[버그]`, `[제안]`, `[문의]`)와 내용 템플릿이 자동 적용
- `메일 앱으로 열기` 버튼을 누르면 `mailto:` 로 기본 메일 앱이 실행됨
- 메일 앱이 없는 환경을 위해 `주소 복사` 버튼 제공

받는 주소는 `contact.js` 상단에서 변경합니다.

```javascript
const MAIL_TO = 'hello@example.com';   // ← 본인 메일 주소로 교체
```

---

## 🛠 사용 기술

순수 **HTML5 · CSS3 · Vanilla JavaScript (ES2020+)** 로 작성되었고, 아래 라이브러리만 CDN으로 불러옵니다.

| 라이브러리 | 용도 | 사용 앱 |
|---|---|---|
| `pdf.js` | PDF 텍스트 추출 | 문서 분석기, 문서 요약기 |
| `mammoth.js` | DOCX 텍스트 추출 | 문서 분석기, 문서 요약기 |
| `pdf-lib` | PDF 병합·생성 | PDF 병합기 |
| `lamejs` | MP3 인코딩 | 오디오 편집기 |

주요 브라우저 API — `Canvas 2D`, `Web Audio API`, `OfflineAudioContext`, `File API`, `Clipboard API`, `LocalStorage`

---

## 🌐 브라우저 지원

| 브라우저 | 상태 | 참고 |
|---|:--:|---|
| Chrome / Edge | ✅ 권장 | 모든 기능 정상 동작 |
| Firefox | ⚠️ 일부 제약 | 오디오 코덱 지원 범위가 좁음 |
| Safari | ⚠️ 일부 제약 | `select` 옵션 스타일, 일부 코덱 미지원 |
| 모바일 | ✅ | 반응형 대응 완료 |

---

## 🎨 디자인 토큰

`style.css` 최상단의 CSS 변수만 수정하면 전체 앱의 테마가 한 번에 바뀝니다.

```css
:root {
  --bg:      #0d0f1e;
  --panel:   #171a2e;
  --text:    #e8eaf6;
  --muted:   #9aa0c0;
  --border:  rgba(255,255,255,.12);
  --accent:  #7c6cff;
  --accent2: #38d6c6;
  --danger:  #ff6b6b;
}
```

---

## 📌 새 앱 추가하기

1. `newapp.html` · `newapp.js` 파일 생성
2. 기존 앱의 HTML 골격(`.wrap` → `.back-link` → `.page-head` → `.panel`) 복사
3. `<link rel="stylesheet" href="style.css" />` 연결
4. `index.html`의 `.card-grid` 안에 카드 추가
5. 공통 클래스(`panel`, `ghost-btn`, `primary-btn`, `up-zone`, `range-input`) 재사용

```html
<a class="app-card" href="newapp.html">
  <span class="app-icon">🆕</span>
  <h2>새 앱 이름</h2>
  <p>한 줄 설명</p>
  <span class="app-btn">바로가기 →</span>
</a>
```

> 💡 앱이 12개가 되면 3열 그리드가 딱 맞으므로, `.coming-soon` 카드를 제거하거나 `grid-column: 1 / -1` 로 바꿔 한 줄 전체를 차지하면 깔끔합니다.

---

## ⚠️ 알려진 한계

- 스캔(이미지) PDF는 텍스트 레이어가 없어 추출이 되지 않습니다 — OCR 필요
- 한글 조사 처리는 규칙 기반이라 정밀한 형태소 분석에는 한계가 있습니다
- MP3 인코딩은 파일 길이에 비례해 수 초~수십 초 소요됩니다
- 대용량 파일은 브라우저 메모리 한도 내에서만 처리됩니다
- `mailto:` 는 OS 기본 메일 앱을 여는 방식이므로, 앱이 지정되지 않은 환경에서는 동작하지 않습니다

---

## 📄 라이선스

개인 학습 및 비상업적 용도로 자유롭게 사용·수정할 수 있습니다.
CDN으로 불러오는 외부 라이브러리는 각 프로젝트의 라이선스를 따릅니다.
