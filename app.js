const PROXY_URL = 'https://meu-projeto-node-q761.onrender.com/stream?url=';

async function carregarCanais() {
  const btn = document.getElementById('btnLogin');
  const serverInput = document.getElementById('server');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');

  const server = serverInput.value.trim();
  const user = userInput.value.trim();
  const pass = passInput.value.trim();

  if (!server || !user || !pass) {
    alert("Preencha todos os campos!");
    return;
  }

  btn.innerText = "A carregar...";
  btn.disabled = true;

  const cleanServer = server.replace(/\/+$/, '');
  const apiUrl = `${cleanServer}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;
  const finalUrl = PROXY_URL + encodeURIComponent(apiUrl);

  try {
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const canais = await res.json();
    renderizarCanais(canais, cleanServer, user, pass);
  } catch (err) {
    alert("Erro ao carregar lista de canais: " + err.message);
  } finally {
    btn.innerText = "Carregar Canais";
    btn.disabled = false;
  }
}

function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  if (!Array.isArray(canais) || canais.length === 0) {
    container.innerHTML = '<p style="text-align:center;">Nenhum canal encontrado.</p>';
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

  // Pedido em HLS .m3u8
  const streamUrl = `${cleanServer}/live/${user}/${pass}/${streamId}.m3u8`;
  const finalStreamUrl = PROXY_URL + encodeURIComponent(streamUrl);

  videoPlayer.pause();
  videoPlayer.src = finalStreamUrl;
  videoPlayer.load();
  videoPlayer.play().catch(err => {
    console.log("Erro na reprodução:", err);
  });
}
