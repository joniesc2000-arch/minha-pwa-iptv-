const PROXY_URL = "https://iptv-proxy-vercel.vercel.app/?url=";

// Restaura as credenciais salvas ao abrir a app
window.addEventListener('DOMContentLoaded', () => {
  const savedServer = localStorage.getItem('iptv_server');
  const savedUser = localStorage.getItem('iptv_user');
  const savedPass = localStorage.getItem('iptv_pass');

  if (savedServer) document.getElementById('server').value = savedServer;
  if (savedUser) document.getElementById('username').value = savedUser;
  if (savedPass) document.getElementById('password').value = savedPass;
});

function salvarCredenciais(server, user, pass) {
  localStorage.setItem('iptv_server', server);
  localStorage.setItem('iptv_user', user);
  localStorage.setItem('iptv_pass', pass);
}

async function carregarCanais() {
  let server = document.getElementById('server').value.trim().replace(/\/+$/, '');
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha todos os campos.");
    return;
  }

  salvarCredenciais(server, user, pass);

  const apiUrl = `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;
  const proxiedApiUrl = PROXY_URL + encodeURIComponent(apiUrl);

  try {
    const response = await fetch(proxiedApiUrl);
    const data = await response.json();

    if (Array.isArray(data)) {
      renderizarCanais(data, server, user, pass);
    } else {
      alert("Erro ao obter lista de canais. Verifique os dados.");
    }
  } catch (err) {
    console.error(err);
    alert("Falha na ligação ao servidor.");
  }
}

function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  canais.forEach(canal => {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.innerText = canal.name;

    const streamUrl = `${server}/live/${user}/${pass}/${canal.stream_id}.ts`;
    div.onclick = () => window.location.href = "vlc://" + streamUrl;
    container.appendChild(div);
  });
}

// Função de exportação / abertura nativa
function exportarListaParaVLC() {
  let server = document.getElementById('server').value.trim().replace(/\/+$/, '');
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha o Servidor, Utilizador e Palavra-passe primeiro.");
    return;
  }

  salvarCredenciais(server, user, pass);

  const m3uUrl = `${server}/get.php?username=${user}&password=${pass}&type=m3u_plus&output=ts`;
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // iOS
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    // Tenta abrir no Outplayer
    window.location.href = "outplayer://" + m3uUrl;
  } 
  // Android
  else if (/android/i.test(ua)) {
    const cleanUrl = m3uUrl.replace(/^https?:\/\//, '');
    window.location.href = `intent://${cleanUrl}#Intent;scheme=http;type=audio/x-mpegurl;end`;
  } 
  else {
    alert("Função disponível apenas para telemóveis (iOS / Android).");
  }
}
