window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gi = urlParams.get("gi");
    const name = urlParams.get("name");
  
    if (!gi || !name) {
      document.getElementById("info").innerText = "정보를 불러올 수 없습니다.";
      return;
    }
  
    try {
      const apiUrl = `https://corsproxy.io/?https://script.google.com/macros/s/AKfycbz6ergFsT1BEmYxGZVJW7f8ucYyONFptyAFYzA0ppDSLoAJO-BlHBkBrtmCKnbt_qeH/exec?action=getUserInfo&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
  
      if (!data.success) {
        document.getElementById("info").innerText = "정보를 불러올 수 없습니다.";
        return;
      }
  
      // 조편성 정보가 없는 경우
      if (!data.team || data.team.trim() === "") {
        document.getElementById("noTeamMessage").style.display = "block";
        return;
      }
  
      // 조편성 정보가 있는 경우
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
      document.getElementById("info").innerText = "서버 연결에 실패했습니다.";
      console.error(err);
    }
  };
  
  function goHome() {
    window.location.href = "index.html";
  }
  