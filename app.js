const PROXY_URL = "https://iptv-proxy.fjcmy9zbbd.workers.dev/?url=";
let hlsPlayer = null;

window.addEventListener('DOMContentLoaded', () => {
  const savedServer = localStorage.getItem('iptv_server');
  const savedUser = localStorage.getItem('iptv_user');
  const savedPass = localStorage.getItem('iptv_pass');

  if (savedServer) document.getElementById('server').value = savedServer;
  if (savedUser) document.getElementById('username').value = savedUser;
  if (savedPass) document.getElementById('password').value = savedPass;

  const savedChannels = localStorage.getItem('iptv_channels');
  if (savedChannels) {
    try {
      renderizarCanais(JSON.parse(savedChannels), savedServer, savedUser, savedPass);
    } catch (e) {}
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
      alert("Credenciais incorretas ou erro no servidor.");
    }
  } catch (err) {
    alert("Erro ao carregar lista: " + err.message);
  }
}

function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  canais.forEach(canal => {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.innerText = canal.name;

    // Constrói URL direta do canal
    const streamUrl = `${server}/live/${user}/${pass}/${canal.stream_id}.m3u8`;

    div.onclick = () => reproduzirStream(streamUrl);
    container.appendChild(div);
  });
}

function reproduzirStream(url) {
  const video = document.getElementById('videoPlayer');
  const proxiedUrl = PROXY_URL + encodeURIComponent(url);

  // Destruir instância anterior do HLS se existir
  if (hlsPlayer) {
    hlsPlayer.destroy();
  }

  // 1. Tentar utilizar a biblioteca HLS.js
  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    hlsPlayer = new Hls({
      manifestLoadingTimeOut: 15000,
      fragLoadingTimeOut: 20000,
      enableWorker: true,
    });
    
    hlsPlayer.loadSource(proxiedUrl);
    hlsPlayer.attachMedia(video);
    hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(e => console.log("Autoplay bloqueado:", e));
    });

    hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        // Fallback: tentar formato .ts diretamente se o .m3u8 falhar
        const tsUrl = url.replace('.m3u8', '.ts');
        hlsPlayer.loadSource(PROXY_URL + encodeURIComponent(tsUrl));
      }
    });
  } 
  // 2. Fallback nativo para Safari/iOS
  else {
    video.pause();
    video.src = proxiedUrl;
    video.load();
    video.play().catch(() => {
      // Tenta a stream com terminação .ts
      const tsUrl = url.replace('.m3u8', '.ts');
      video.src = PROXY_URL + encodeURIComponent(tsUrl);
      video.load();
      video.play().catch(e => alert("Não foi possível reproduzir este canal."));
    });
  }
}
