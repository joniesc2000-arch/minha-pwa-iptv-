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
  const server = document.getElementById('server').value.trim();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha todos os campos!");
    return;
  }

  const cleanServer = server.replace(/\/+$/, '');
  const apiUrl = `${cleanServer}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;
  
  // Passa o pedido da lista de canais pelo Proxy para evitar bloqueios de CORS/HTTPS
  const finalUrl = PROXY_URL + encodeURIComponent(apiUrl);

  try {
    const res = await fetch(finalUrl);
    const canais = await res.json();
    renderizarCanais(canais, cleanServer, user, pass);
  } catch (err) {
    alert("Erro ao carregar canais. Verifique os dados ou o proxy.");
    console.error(err);
  }
}

function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  if (!Array.isArray(canais)) {
    container.innerHTML = '<p>Nenhum canal encontrado ou dados incorretos.</p>';
    return;
  }

  canais.forEach(canal => {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.innerText = canal.name;
    div.onclick = () => tocarCanal(server, user, pass, canal.stream_id);
    container.appendChild(div);
  });
}

function tocarCanal(server, user, pass, streamId) {
  const videoPlayer = document.getElementById('videoPlayer');
  const cleanServer = server.replace(/\/+$/, '');
  
  const streamUrl = `${cleanServer}/live/${user}/${pass}/${streamId}.m3u8`;
  const finalStreamUrl = PROXY_URL + encodeURIComponent(streamUrl);

  videoPlayer.src = finalStreamUrl;
  videoPlayer.play().catch(err => console.log("Erro na reprodução:", err));
}
