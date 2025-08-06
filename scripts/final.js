window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gi = urlParams.get("gi");
    const name = urlParams.get("name");
  
    if (!gi || !name) {
      showError("정보를 불러올 수 없습니다.");
      return;
    }
  
    try {
      const apiUrl = `https://corsproxy.io/?https://script.google.com/macros/s/AKfycbz6ergFsT1BEmYxGZVJW7f8ucYyONFptyAFYzA0ppDSLoAJO-BlHBkBrtmCKnbt_qeH/exec?action=getUserInfo&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      const res = await fetch(apiUrl);
  
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response type");
      }
  
      const data = await res.json();
  
      if (!data.success) {
        showError("정보를 불러올 수 없습니다.");
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