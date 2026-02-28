// small helpers (safe & simple)
document.getElementById('year').textContent = new Date().getFullYear();

function copyText(text){
  try{
    navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  }catch(e){
    // fallback
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    alert("Copied: " + text);
  }
}