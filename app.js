const PROXY_URL = 'https://meu-projeto-node-q761.onrender.com/stream?url=';
let hlsInstance = null;

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

  // Usamos o formato direto do Xtream
  const streamUrl = `${cleanServer}/live/${user}/${pass}/${streamId}.ts`;
  const finalStreamUrl = PROXY_URL + encodeURIComponent(streamUrl);

  // Limpa instância HLS anterior se existir
  if (hlsInstance) {
    hlsInstance.destroy();
  }

  // Tenta reproduzir via HLS.js se suportado
  if (Hls.isSupported()) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });
    hlsInstance.loadSource(finalStreamUrl);
    hlsInstance.attachMedia(videoPlayer);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      videoPlayer.play().catch(e => console.log(e));
    });
  } 
  // Fallback para o leitor nativo do iOS Safari
  else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    videoPlayer.src = finalStreamUrl;
    videoPlayer.play().catch(e => console.log(e));
  } else {
    alert("O seu navegador não suporta a reprodução deste formato.");
  }
}
