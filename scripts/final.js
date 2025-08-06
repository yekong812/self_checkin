window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gi = urlParams.get("gi");
    const name = urlParams.get("name");
  
    if (!gi || !name) {
      showError("정보를 불러올 수 없습니다.");
      return;
    }
  
    try {
      const targetUrl = `https://script.google.com/macros/s/AKfycbwz6Kc9hopwtZDohcRwiLYUtT4hx451lhzmaTmxwI5dskgFRYNdWneHC6bx5Y_l-pOM/exec?action=getUserInfo&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
  
      // Google Apps Script 응답은 text/plain으로 올 수 있으므로 헤더 체크 제거
      // const contentType = res.headers.get("content-type");
      // if (!contentType || !contentType.includes("application/json")) {
      //   throw new Error("Invalid response type");
      // }
  
            let data;
      try {
        // 응답 텍스트를 먼저 확인
        const responseText = await res.text();
        console.log("서버 응답 텍스트:", responseText);
        
        // JSON 파싱 시도
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON 파싱 오류:", parseError);
        console.error("응답 상태:", res.status);
        console.error("응답 헤더:", res.headers);
        showError("서버 응답 형식 오류입니다.");
        return;
      }

      if (!data.success) {
        const errorMessage = data.error || "정보를 불러올 수 없습니다.";
        showError(errorMessage);
        return;
      }
  
      if (!data.team || data.team.trim() === "") {
        document.getElementById("noTeamMessage").style.display = "block";
        return;
      }
  
      const infoText = `
        <p><strong>기수:</strong> ${data.gi}</p>
        <p><strong>이름:</strong> ${data.name}</p>
        <p><strong>티셔츠 사이즈:</strong> ${data.shirt}</p>
        <p><strong>조:</strong> ${data.team}</p>
      `;
      document.getElementById("info").innerHTML = infoText;
  
      const qrContent = `기수: ${data.gi}, 이름: ${data.name}, 조: ${data.team}, 티셔츠: ${data.shirt}`;
      QRCode.toCanvas(document.getElementById("qrcode"), qrContent, error => {
        if (error) console.error(error);
      });
  
    } catch (err) {
      console.error(err);
      showError("서버 응답 오류입니다.");
    }
  };
  
  function showError(message) {
    document.getElementById("info").innerHTML = `<p class="warning">${message}</p>`;
  }
  
  function goHome() {
    window.location.href = "index.html";
  }