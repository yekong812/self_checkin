async function handleLogin() {
    const gi = document.getElementById("gi").value.trim();
    const name = document.getElementById("name").value.trim();
  
    if (!gi || !name) {
      alert("기수와 이름을 모두 입력해주세요.");
      return;
    }
  
    // 실제 GAS 주소
    const targetUrl = `https://script.google.com/macros/s/AKfycbz6ergFsT1BEmYxGZVJW7f8ucYyONFptyAFYzA0ppDSLoAJO-BlHBkBrtmCKnbt_qeH/exec?action=verifyLoginAndPayment&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
  
    // 프록시 주소로 감싸기
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
  
    try {
      const res = await fetch(proxyUrl);
      const data = await res.json();
  
      if (!data.success) {
        window.location.href = `fail.html`;
      } else if (data.paid) {
        window.location.href = `final.html?gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      } else {
        window.location.href = `account.html?gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
      }
    } catch (err) {
      alert("서버 연결에 실패했습니다.");
      console.error(err);
    }
  }
  