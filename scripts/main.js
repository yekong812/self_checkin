async function handleLogin() {
    const gi = document.getElementById("gi").value.trim();
    const name = document.getElementById("name").value.trim();
  
    if (!gi || !name) {
      alert("기수와 이름을 모두 입력해주세요.");
      return;
    }
  
    const url = `https://script.google.com/macros/s/웹앱-배포-URL/exec?action=verifyLoginAndPayment&gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    const data = await res.json();
  
    if (!data.success) {
      window.location.href = `fail.html`;
    } else if (data.paid) {
      window.location.href = `final.html?gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
    } else {
      window.location.href = `account.html?gi=${encodeURIComponent(gi)}&name=${encodeURIComponent(name)}`;
    }
  }
  