const PROXY_URL = "https://iptv-proxy.fjcmy9zbbd.workers.dev/?url=";

// Carregar dados salvos ao abrir a app
window.addEventListener('DOMContentLoaded', () => {
  const savedServer = localStorage.getItem('iptv_server');
  const savedUser = localStorage.getItem('iptv_user');
  const savedPass = localStorage.getItem('iptv_pass');

  if (savedServer) document.getElementById('server').value = savedServer;
  if (savedUser) document.getElementById('username').value = savedUser;
  if (savedPass) document.getElementById('password').value = savedPass;

  // Se já houver canais em memória, carrega automaticamente
  const savedChannels = localStorage.getItem('iptv_channels');
  if (savedChannels) {
    try {
      const canais = JSON.parse(savedChannels);
      renderizarCanais(canais, savedServer, savedUser, savedPass);
    } catch (e) {
      console.error("Erro ao carregar canais salvos", e);
    }
  }
});

async function carregarCanais() {
  const server = document.getElementById('server').value.replace(/\/$/, '');
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (!server || !user || !pass) {
    alert("Preencha todos os campos.");
    return;
  }

  // Guardar credenciais no armazenamento local
  localStorage.setItem('iptv_server', server);
  localStorage.setItem('iptv_user', user);
  localStorage.setItem('iptv_pass', pass);

  const apiUrl = `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;

  try {
    const res = await fetch(PROXY_URL + encodeURIComponent(apiUrl));
    const canais = await res.json();

    if (Array.isArray(canais)) {
      localStorage.setItem('iptv_channels', JSON.stringify(canais));
      renderizarCanais(canais, server, user, pass);
    } else {
      alert("Credenciais incorretas ou erro na resposta do servidor.");
    }
  } catch (err) {
    alert("Erro ao carregar lista de canais: " + err.message);
  }
}

function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  canais.forEach(canal => {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.innerText = canal.name;

    // Tenta primeiro o formato HLS (.m3u8), comum em Xtream Codes
    const streamUrlHls = `${server}/live/${user}/${pass}/${canal.stream_id}.m3u8`;
    // Formato alternativo MPEG-TS (.ts)
    const streamUrlTs = `${server}/live/${user}/${pass}/${canal.stream_id}.ts`;

    div.onclick = () => reproduzirStream(streamUrlHls, streamUrlTs);
    container.appendChild(div);
  });
}

function reproduzirStream(urlHls, urlTs) {
  const video = document.getElementById('videoPlayer');
  const proxiedHls = PROXY_URL + encodeURIComponent(urlHls);
  const proxiedTs = PROXY_URL + encodeURIComponent(urlTs);

  // 1. Tentar via HLS.js (se suportado na PWA)
  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    if (window.hlsInstance) {
      window.hlsInstance.destroy();
    }
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });
    window.hlsInstance = hls;
    hls.loadSource(proxiedHls);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });
    
    // Se o formato .m3u8 falhar no hls.js, tenta o .ts nativo
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        hls.destroy();
        video.src = proxiedTs;
        video.play().catch(() => {});
      }
    });
  } 
  // 2. Tentar suporte nativo do Safari (iOS)
  else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = proxiedHls;
    video.play().catch(() => {
      // Caso o .m3u8 não responda, altera para a stream .ts
      video.src = proxiedTs;
      video.play().catch(() => alert("Não foi possível reproduzir este canal."));
    });
  } else {
    video.src = proxiedTs;
    video.play().catch(() => {});
  }
}
