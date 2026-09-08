// 구글 스프레드시트 URL을 여기에 입력하세요.
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1hUXnsHuokWOC_ejOLsnxmieenJ8JjKRRqAcqHKXccJk/edit";

/**
 * 웹앱 접속 시 index.html 페이지를 렌더링합니다.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('GamePulse - 게임 선호도 조사')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * 클라이언트(웹 화면)에서 전송한 설문 데이터를 스프레드시트에 저장합니다.
 * @param {Object} formData - 제출된 설문 데이터 {age, gender, game_select, other_game}
 */
function saveSurveyData(formData) {
  try {
    const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    let sheet = ss.getSheetByName("설문응답");
    
    // '설문응답' 시트가 없으면 자동으로 생성하고 헤더를 추가합니다.
    if (!sheet) {
      sheet = ss.insertSheet("설문응답");
      sheet.appendRow(["제출 일시", "나이", "성별", "선호 게임", "기타 게임명"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
    }

    // 성별 한글 변환
    const genderText = formData.gender === 'male' ? '남성' : (formData.gender === 'female' ? '여성' : formData.gender);
    
    // 선택된 게임명 변환
    const gameMap = {
      'minecraft': '마인크래프트',
      'lol': '리그오브레전드',
      'pubg': '배틀그라운드',
      'fifa': '피파',
      'other': '그외'
    };
    const gameText = gameMap[formData.game_select] || formData.game_select;

    // 데이터 행 추가
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      Number(formData.age),
      genderText,
      gameText,
      formData.other_game || ""
    ]);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}