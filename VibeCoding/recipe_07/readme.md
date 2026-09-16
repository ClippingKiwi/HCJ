# 🖼️ Image Edit - Smart Image Resizer

> 브라우저 상에서 빠르게 이미지를 원하는 비율로 변환하고 패딩(Padding) 및 크롭(Crop) 처리를 할 수 있는 스마트 이미지 리사이징 웹 애플리케이션입니다.

별도의 서버 연동 없이 **100% 클라이언트 측(Browser-side)**에서 동작하므로 이미지 유출 우려 없이 안심하고 사용할 수 있으며 빠른 처리 속도를 제공합니다.

---

## 🚀 주요 기능

1. **상단 브랜드 헤더**: 이미지 심볼 아이콘과 `Image Edit`, `Smart Image Resizer` 타이틀 구성
2. **드래그 앤 드롭 업로드**: 클릭 또는 드래그 앤 드롭 방식으로 여러 개의 이미지 파일(PNG, JPG, WEBP 등)을 한 번에 업로드 가능
3. **다양한 캔버스 비율 지원**:
   - 프리셋 비율: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`
   - 사용자 지정 비율: `커스텀` 선택 시 원하는 너비/높이 픽셀 또는 정수 비율 직접 입력 가능
4. **2가지 종횡비 맞춤 모드**:
   - **Padding (여백 추가)**: 사진 비율을 유지하면서 부족한 공간에 여백을 채웁니다. (컬러 피커를 통해 여백 색상 자유 지정 가능, 기본값: 흰색 `#FFFFFF`)
   - **Crop (자르기)**: 사진의 비율을 캔버스 비율에 맞추어 중앙을 기준으로 자릅니다.
5. **실시간 리스트 & 프로그레스 바**:
   - 입력된 사진들의 썸네일과 파일 정보 표시
   - 이미지별 처리 진행 상황(0% ~ 100%)을 보여주는 애니메이션 프로그레스 바 제공
6. **개별 및 일괄 다운로드**:
   - **개별 다운로드**: 작업 완료(100%) 시 개별 이미지 다운로드 버튼 활성화
   - **일괄 다운로드 (ZIP)**: 모든 작업 완료 시 `JSZip` 라이브러리를 통해 한 번에 압축 파일(`.zip`) 형태로 다운로드 가능

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (CDN)
- **Icons**: [Lucide Icons](https://lucide.dev/) (CDN)
- **Archiving**: [JSZip](https://stuk.github.io/jszip/) (CDN)
- **Engine**: HTML5 Canvas API

---

## 📁 파일 구조 (Directory Structure)

```text
.
├── index.html       # 웹 앱 기본 구조 및 UI 컴포넌트
├── style.css        # 커스텀 CSS 스타일 정의 (드래그 앤 드롭 상태 등)
├── script.js       # Canvas 리사이징 및 JSZip 일괄 다운로드 로직
└── README.md        # 프로젝트 설명 문서