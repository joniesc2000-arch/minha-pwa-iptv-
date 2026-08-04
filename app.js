const PROXY_URL = "https://meu-projeto-node-q761.onrender.com/stream?url=";
// Restaura credenciais salvas no carregamento
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

// 1. Obter a lista de canais via Proxy
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
      alert("Erro nas credenciais ou dados inválidos.");
    }
  } catch (err) {
    console.error(err);
    alert("Falha na ligação ao servidor.");
  }
}

// 2. Apresentar os canais na lista
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

    // Ação ao clicar no canal
    div.onclick = () => tocarCanal(server, user, pass, canal.stream_id);
    container.appendChild(div);
  });
}

// 3. Reprodução compatível com iOS (HLS)
function tocarCanal(server, user, pass, streamId) {
  const videoPlayer = document.getElementById('videoPlayer');

  if (!videoPlayer) {
    alert("Elemento de vídeo não encontrado no HTML.");
    return;
  }

  // Limpa barras / no final do endereço do servidor para evitar http://servidor//live/
  const cleanServer = server.replace(/\/+$/, '');

  // URL em formato HLS exige o formato .m3u8 no iOS
  const streamUrl = `${cleanServer}/live/${user}/${pass}/${streamId}.m3u8`;

  // Passa SEMPRE pelo proxy HTTPS
  const finalStreamUrl = PROXY_URL + encodeURIComponent(streamUrl);

  videoPlayer.src = finalStreamUrl;
  videoPlayer.play().catch(err => {
    console.log("Erro ao iniciar reprodução:", err);
  });
}
