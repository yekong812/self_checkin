(async function () {
    const params = new URLSearchParams(window.location.search);
    const gi = params.get("gi");
    const name = params.get("name");
  
    const url = `https://script.google.com/macros/s/AKfycbz6ergFsT1BEmYxGZVJW7f8ucYyONFptyAFYzA0ppDSLoAJO-BlHBkBrtmCKnbt_qeH/exec?action=getUserInfo&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    const data = await res.json();
  
    if (!data || !data.team || !data.shirt) {
      document.getElementById("userInfo").innerText = "정보를 불러올 수 없습니다.";
      return;
    }
  
    const infoText = `이름: ${data.name}\n기수: ${data.gi}\n조: ${data.team}\n티셔츠: ${data.shirt}`;
    document.getElementById("userInfo").innerText = infoText;
  
    QRCode.toCanvas(document.getElementById('qrcode'), infoText, function (error) {
      if (error) console.error(error);
    });
  })();
  