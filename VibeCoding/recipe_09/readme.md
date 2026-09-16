# 🎬 GIF Editor — Smart GIF Studio

브라우저에서 동작하는 무료 GIF 편집기입니다. 모든 처리가 로컬에서 이루어지며 파일이 서버로 전송되지 않습니다.

## 기능

- GIF 파일 업로드 (드래그 앤 드롭 + 파일 선택)
- 미리보기 및 파일 정보 표시 (파일명, 해상도, 용량)
- 편집 결과 다운로드
- 데스크톱 / 모바일 반응형 레이아웃
- 리사이징 · 다운스케일 · 크롭 · FPS 조절 *(개발 예정)*

## 구조

```
gif-editor/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 실행

```bash
git clone https://github.com/your-username/gif-editor.git
cd gif-editor
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속. (`index.html` 직접 열기도 가능)

## 사용법

1. GIF 파일을 드래그하거나 `Choose File` 클릭
2. 미리보기 확인
3. 우측(모바일은 하단) 편집 패널에서 편집 *(개발 예정)*
4. `Download` 버튼으로 저장

## 기술 스택

HTML5 · CSS3 (Grid, Flexbox) · Vanilla JavaScript (File API, Blob URL)

외부 라이브러리 및 빌드 도구를 사용하지 않습니다.

## 반응형 기준

| 화면 폭 | 레이아웃 |
|---|---|
| 861px 이상 | GIF 좌측 / 편집 패널 우측 |
| 860px 이하 | GIF 상단 / 편집 패널 하단 |

## 편집 기능 확장

편집 결과 Blob을 `state.editedBlob`에 저장하면 다운로드에 자동 반영됩니다.

```javascript
state.editedBlob = resultBlob;
previewImg.src = URL.createObjectURL(resultBlob);
```

## 라이선스

MIT
