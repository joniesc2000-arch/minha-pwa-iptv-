const PROXY_URL = "https://iptv-proxy-vercel.vercel.app/?url=";

// Restaura credenciais guardadas
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

// 1. Obter a lista de canais
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
      alert("Erro nas credenciais ou resposta inválida do servidor.");
    }
  } catch (err) {
    console.error(err);
    alert("Falha na ligação ao proxy/servidor.");
  }
}

// 2. Renderizar a lista de canais com evento de clique corrigido
function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  canais.forEach(canal => {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.style.padding = '12px';
    div.style.borderBottom = '1px solid #222';
    div.style.cursor = 'pointer';
    div.innerText = canal.name;

    // Associa o clique à reprodução nativa HLS (.m3u8)
    div.onclick = () => tocarCanal(server, user, pass, canal.stream_id);
    container.appendChild(div);
  });
}

// 3. Reprodução compatível com iOS WebKit
function tocarCanal(server, user, pass, streamId) {
  const videoPlayer = document.getElementById('videoPlayer');

  if (!videoPlayer) {
    alert("Elemento de vídeo não encontrado no HTML.");
    return;
  }

  // No iOS é obrigatório utilizar a extensão .m3u8 para reprodução nativa
  const streamUrl = `${server}/live/${user}/${pass}/${streamId}.m3u8`;
  const proxiedStreamUrl = PROXY_URL + encodeURIComponent(streamUrl);

  videoPlayer.src = proxiedStreamUrl;
  
  // Tenta iniciar o vídeo
  const playPromise = videoPlayer.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log("Erro de autopreview/reprodução:", error);
      // Tentativa de fallback direto caso o proxy barre o cabeçalho HLS
      videoPlayer.src = streamUrl;
      videoPlayer.play().catch(e => console.log("Fallback HTTP falhou:", e));
    });
  }
}
