window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gi = urlParams.get("gi");
    const name = urlParams.get("name");
    const loadingEl = document.getElementById("loading");
    const infoEl = document.getElementById("info");
    const qrcodeEl = document.getElementById("qrcode");
  
    if (!gi || !name) {
      showError("정보를 불러올 수 없습니다.");
      return;
    }
  
    // 로딩 상태 시작
    loadingEl.style.display = "block";
    infoEl.style.display = "none";
    qrcodeEl.style.display = "none";
  
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
  
      // 조 배정 여부 확인
      const hasTeam = data.team && data.team.trim() !== "";
      
      const infoText = `
        <p><strong>기수:</strong> ${data.gi}</p>
        <p><strong>이름:</strong> ${data.name}</p>
        <p><strong>티셔츠 사이즈:</strong> ${data.shirt}</p>
        <p><strong>조:</strong> ${hasTeam ? data.team : "미배정 (조 필요시 스텝에게 얘기해주세요)"}</p>
      `;
      document.getElementById("info").innerHTML = infoText;
  
      const qrContent = `기수: ${data.gi}, 이름: ${data.name}, 조: ${hasTeam ? data.team : "미배정"}, 티셔츠: ${data.shirt}`;
      QRCode.toCanvas(document.getElementById("qrcode"), qrContent, error => {
        if (error) console.error(error);
      });
  
      // 로딩 완료 후 콘텐츠 표시
      loadingEl.style.display = "none";
      infoEl.style.display = "block";
      qrcodeEl.style.display = "block";
  
    } catch (err) {
      console.error(err);
      showError("서버 응답 오류입니다.");
    } finally {
      // 로딩 상태 종료
      loadingEl.style.display = "none";
    }
  };
  
  function showError(message) {
    document.getElementById("info").innerHTML = `<p class="warning">${message}</p>`;
  }
  
  function goHome() {
    window.location.href = "index.html";
  }