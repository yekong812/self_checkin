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
    if (!ss) {
      console.error("스프레드시트 객체가 null입니다");
      return false;
    }
    
    const paymentSheet = ss.getSheetByName("회비");
    if (!paymentSheet) {
      console.error("회비 시트를 찾을 수 없습니다");
      return false;
    }
    
    // 더 안전한 데이터 접근
    const lastRow = paymentSheet.getLastRow();
    const lastCol = paymentSheet.getLastColumn();
    
    if (lastRow === 0 || lastCol === 0) {
      console.error("회비 시트에 데이터가 없습니다");
      return false;
    }
    
    const data = paymentSheet.getRange(1, 1, lastRow, lastCol).getValues();

    for (let row of data) {
      if (!row || row.length < 4) continue; // 4열 미만이면 건너뛰기
      
      const rowGi = normalizeGi(row[0]);
      const rowName = (row[1] + "").trim();
      const status = row[3];
      
      if (rowGi === gi && rowName === name) {
        // null, undefined, 빈 문자열인 경우 false 반환
        if (status === null || status === undefined || status === "") {
          return false;
        }
        // O 또는 o인 경우만 true 반환
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
    
    // 데이터 범위 확인 - 더 안전한 방법
    let data = [];
    try {
      // 시트의 마지막 행과 열 확인
      const lastRow = responseSheet.getLastRow();
      const lastCol = responseSheet.getLastColumn();
      
      if (lastRow === 0 || lastCol === 0) {
        return jsonResponse({ 
          success: false, 
          error: "시트에 데이터가 없습니다." 
        });
      }
      
      // A1부터 마지막 셀까지 데이터 가져오기
      const range = responseSheet.getRange(1, 1, lastRow, lastCol);
      data = range.getValues();
      
      console.log("데이터 행 수:", data.length);
      console.log("데이터 열 수:", data[0] ? data[0].length : 0);
      
    } catch (rangeError) {
      console.error("데이터 범위 오류:", rangeError);
      return jsonResponse({ 
        success: false, 
        error: "데이터를 읽을 수 없습니다: " + rangeError.toString() 
      });
    }
    
    // 사용자 정보 찾기
    let userInfo = null;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 4) continue; // 행이 비어있거나 4열 미만이면 건너뛰기
      
      const rowGi = normalizeGi(row[0]);
      const rowName = (row[1] + "").trim();
      
      console.log(`행 ${i}: 기수=${rowGi}, 이름=${rowName}, 찾는값=${gi}, ${name}`);
      
      if (rowGi === gi && rowName === name) {
        userInfo = {
          shirtSize: row[3] || "M" // D열: 티셔츠 사이즈
        };
        console.log("사용자 찾음:", row);
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
        const teamLastRow = teamSheet.getLastRow();
        const teamLastCol = teamSheet.getLastColumn();
        
        if (teamLastRow > 0 && teamLastCol > 0) {
          const teamRange = teamSheet.getRange(1, 1, teamLastRow, teamLastCol);
          const teamData = teamRange.getValues();
          
          for (let row of teamData) {
            if (!row || row.length < 3) continue;
            
            const rowGi = normalizeGi(row[0]);
            const rowName = (row[1] + "").trim();
            if (rowGi === gi && rowName === name) {
              team = row[2] || ""; // C열: 조 정보
              break;
            }
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

function testCheckPaymentStatus() {
  const testGi = "19";
  const testName = "이은선";
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log("스프레드시트 객체:", ss ? "존재" : "null");
    
    if (ss) {
      const result = checkPaymentStatus(testGi, testName, ss);
      console.log("회비 확인 결과:", result);
      return result;
    } else {
      console.error("스프레드시트에 접근할 수 없습니다");
      return false;
    }
  } catch (error) {
    console.error("테스트 오류:", error);
    return false;
  }
}

// 더 간단한 테스트 함수
function testCheckPaymentStatusSimple() {
  const testGi = "19";
  const testName = "이은선";
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log("스프레드시트 객체:", ss ? "존재" : "null");
    
    if (!ss) {
      console.error("스프레드시트에 접근할 수 없습니다");
      return false;
    }
    
    const paymentSheet = ss.getSheetByName("회비");
    console.log("회비 시트:", paymentSheet ? "존재" : "null");
    
    if (!paymentSheet) {
      console.error("회비 시트를 찾을 수 없습니다");
      return false;
    }
    
    const lastRow = paymentSheet.getLastRow();
    const lastCol = paymentSheet.getLastColumn();
    console.log("회비 시트 크기:", lastRow, "행 x", lastCol, "열");
    
    if (lastRow === 0 || lastCol === 0) {
      console.error("회비 시트에 데이터가 없습니다");
      return false;
    }
    
    const data = paymentSheet.getRange(1, 1, lastRow, lastCol).getValues();
    console.log("회비 데이터 행 수:", data.length);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 4) {
        console.log(`행 ${i}: 4열 미만, 건너뛰기`);
        continue;
      }
      
      const rowGi = normalizeGi(row[0]);
      const rowName = (row[1] + "").trim();
      const status = row[3];
      
      console.log(`행 ${i}: 기수=${rowGi}, 이름=${rowName}, 상태=${status}, 찾는값=${testGi}, ${testName}`);
      
             if (rowGi === testGi && rowName === testName) {
         // null, undefined, 빈 문자열인 경우 false 반환
         if (status === null || status === undefined || status === "") {
           console.log("사용자 찾음! 회비 미납부 (null/empty)");
           return false;
         }
         // O 또는 o인 경우만 true 반환
         const result = status === "O" || status === "o";
         console.log("사용자 찾음! 회비 납부:", result);
         return result;
       }
    }
    
    console.log("사용자를 찾을 수 없습니다");
    return false;
    
  } catch (error) {
    console.error("테스트 오류:", error);
    return false;
  }
} 