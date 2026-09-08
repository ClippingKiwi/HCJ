/**
 * K-MOVE 동아리 MT 안내 웹앱
 *
 * 배포 방법:
 *  1. script.google.com 에서 새 프로젝트 생성
 *  2. 기본 파일에 이 Code.gs 내용을 붙여넣기
 *  3. 파일 추가 > HTML > 파일명을 "index"로 저장하고 index.html 내용을 붙여넣기
 *  4. 배포 > 새 배포 > 유형: 웹 앱
 *     - 실행 계정: 나
 *     - 액세스 권한: 모든 사용자 (또는 필요에 맞게 조정)
 *  5. 배포 후 생성되는 URL로 접속하면 페이지가 열립니다.
 */

function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('K-MOVE 동아리 MT')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
