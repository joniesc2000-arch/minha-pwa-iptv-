const PROXY_URL = "https://iptv-proxy-vercel.vercel.app/?url=";

// Restaura credenciais salvas
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

// 1. Carrega a lista de canais da API Xtream Codes
async function carregarCanais() {
  let server = document.getElementById('server').value.trim().replace(/\/+$/, '');
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha todos os campos.");
    return;
  }

  salvarCredenciais(server, user, pass);

  // Pedido à API do Xtream Codes para obter os canais em direto
  const apiUrl = `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;
  const proxiedApiUrl = PROXY_URL + encodeURIComponent(apiUrl);

  try {
    const response = await fetch(proxiedApiUrl);
    const data = await response.json();

    if (Array.isArray(data)) {
      renderizarCanais(data, server, user, pass);
    } else {
      alert("Erro ao obter canais. Verifique se os dados estão corretos.");
    }
  } catch (err) {
    console.error(err);
    alert("Falha na ligação ao servidor IPTV.");
  }
}

// 2. Apresenta a lista de canais no ecrã
function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  // Filtra ou exibe os canais
  canais.slice(0, 100).forEach(canal => { // Limite inicial para performance
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.style.padding = '12px';
    div.style.borderBottom = '1px solid #333';
    div.style.cursor = 'pointer';
    div.innerText = canal.name;

    // Quando o cliente clica no canal, reproduz no leitor do topo
    div.onclick = () => tocarCanal(server, user, pass, canal.stream_id);
    container.appendChild(div);
  });
}

// 3. Reproduz o canal diretamente no elemento <video> da PWA
function tocarCanal(server, user, pass, streamId) {
  const videoPlayer = document.getElementById('videoPlayer'); // Garantir que tem <video id="videoPlayer" controls></video> no HTML
  
  // URL de reprodução em HLS / M3U8 ou TS
  const streamUrl = `${server}/live/${user}/${pass}/${streamId}.m3u8`;
  const proxiedStreamUrl = PROXY_URL + encodeURIComponent(streamUrl);

  videoPlayer.src = proxiedStreamUrl;
  videoPlayer.play().catch(e => console.log("Erro ao iniciar reprodução:", e));
}
