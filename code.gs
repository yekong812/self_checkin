function doGet(e) {
  try {
    // e가 없거나 parameter가 없는 경우 처리
    if (!e || !e.parameter) {
      return jsonResponse({ 
        success: false, 
        error: "Invalid request parameters" 
      });
    }

    const action = e.parameter.action;
    const gi = normalizeGi(e.parameter.gi);
    const name = e.parameter.name?.trim();

    if (!gi || !name) {
      return jsonResponse({ 
        success: false, 
        error: "Missing parameters" 
      });
    }

    if (action === "verifyLoginAndPayment") {
      return handleVerifyLoginAndPayment(gi, name);
    } else if (action === "getUserInfo") {
      return handleGetUserInfo(gi, name);
    }

    return jsonResponse({ 
      success: false, 
      error: "Invalid action" 
    });
    
  } catch (error) {
    console.error("doGet 오류:", error);
    return jsonResponse({ 
      success: false, 
      error: "서버 오류: " + error.toString() 
    });
  }
}

function normalizeGi(giValue) {
  const numberMatch = giValue?.toString().match(/\d+/);
  return numberMatch ? parseInt(numberMatch[0]) : null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ✅ 1. 로그인 & 회비 확인
function handleVerifyLoginAndPayment(gi, name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonResponse({ 
        success: false, 
        error: "스프레드시트에 접근할 수 없습니다." 
      });
    }
    
    const responseSheet = ss.getSheetByName("정리된 응답");
    if (!responseSheet) {
      return jsonResponse({ 
        success: false, 
        error: "정리된 응답 시트를 찾을 수 없습니다." 
      });
    }
    
    const data = responseSheet.getDataRange().getValues();

    const found = data.some(row => {
      const rowGi = normalizeGi(row[0]);
      const rowName = (row[1] + "").trim();
      return rowGi === gi && rowName === name;
    });

    if (!found) {
      return jsonResponse({ success: false });
    }

    const paid = checkPaymentStatus(gi, name, ss);
    return jsonResponse({ success: true, paid });
    
  } catch (error) {
    console.error("handleVerifyLoginAndPayment 오류:", error);
    return jsonResponse({ 
      success: false, 
      error: "서버 오류: " + error.toString() 
    });
  }
}

function checkPaymentStatus(gi, name, ss) {
  try {
    const paymentSheet = ss.getSheetByName("회비");
    if (!paymentSheet) return false;
    
    const data = paymentSheet.getDataRange().getValues();

    for (let row of data) {
      const rowGi = normalizeGi(row[0]);
      const rowName = (row[1] + "").trim();
      const status = row[3];
      if (rowGi === gi && rowName === name) {
        return status === "O" || status === "o";
      }
    }
    return false;
  } catch (error) {
    console.error("checkPaymentStatus 오류:", error);
    return false;
  }
}

// ✅ 2. 조 + 티셔츠 정보 제공
function handleGetUserInfo(gi, name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return jsonResponse({ 
        success: false, 
        error: "스프레드시트에 접근할 수 없습니다." 
      });
    }
    
    // 시트 존재 여부 확인
    const responseSheet = ss.getSheetByName("정리된 응답");
    if (!responseSheet) {
      return jsonResponse({ 
        success: false, 
        error: "정리된 응답 시트를 찾을 수 없습니다." 
      });
    }
    
    // 데이터 범위 확인
    let data;
    try {
      const range = responseSheet.getDataRange();
      if (!range) {
        return jsonResponse({ 
          success: false, 
          error: "데이터 범위를 찾을 수 없습니다." 
        });
      }
      data = range.getValues();
    } catch (rangeError) {
      console.error("데이터 범위 오류:", rangeError);
      return jsonResponse({ 
        success: false, 
        error: "데이터를 읽을 수 없습니다." 
      });
    }
    
    // 사용자 정보 찾기
    let userInfo = null;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowGi = normalizeGi(row[0]);
      const rowName = (row[1] + "").trim();
      
      if (rowGi === gi && rowName === name) {
        userInfo = {
          shirtSize: row[3] || "M" // D열: 티셔츠 사이즈
        };
        break;
      }
    }
    
    if (!userInfo) {
      return jsonResponse({ 
        success: false, 
        error: "사용자 정보를 찾을 수 없습니다." 
      });
    }

    // 조 정보는 "조편성" 시트에서 가져오기
    let team = "";
    try {
      const teamSheet = ss.getSheetByName("조편성");
      if (teamSheet) {
        const teamData = teamSheet.getDataRange().getValues();
        for (let row of teamData) {
          const rowGi = normalizeGi(row[0]);
          const rowName = (row[1] + "").trim();
          if (rowGi === gi && rowName === name) {
            team = row[2] || ""; // C열: 조 정보
            break;
          }
        }
      }
    } catch (teamError) {
      console.error("조 정보 조회 오류:", teamError);
      // 조 정보가 없어도 계속 진행
    }
    
    return jsonResponse({
      success: true,
      gi: `${gi}기`,
      name,
      shirt: userInfo.shirtSize,
      team: team
    });
    
  } catch (error) {
    console.error("handleGetUserInfo 오류:", error);
    return jsonResponse({ 
      success: false, 
      error: "서버 오류: " + error.toString() 
    });
  }
}

// 테스트용 함수들
function testSimple() {
  return jsonResponse({
    success: true,
    message: "테스트 성공"
  });
}

function testFindUser() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName("정리된 응답");
  
  if (!responseSheet) {
    console.log("시트를 찾을 수 없습니다");
    return;
  }
  
  const data = responseSheet.getDataRange().getValues();
  console.log("전체 데이터:", data);
  
  // 첫 번째 행 확인
  if (data.length > 0) {
    console.log("첫 번째 행:", data[0]);
    console.log("첫 번째 행의 길이:", data[0].length);
  }
}

function testGetUserInfo() {
  const testGi = "19";
  const testName = "이은선";
  
  const result = handleGetUserInfo(testGi, testName);
  console.log("테스트 결과:", result);
  return result;
} 