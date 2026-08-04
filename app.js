// URL do Proxy para evitar bloqueios CORS/HTTP no iOS Safari
const PROXY_URL = "https://iptv-proxy.fjcmy9zbbd.workers.dev/?url=";

async function carregarCanais() {
  const server = document.getElementById('server').value.replace(/\/$/, '');
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  // Endpoint do Xtream Codes para listar canais em direto
  const apiUrl = `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;

  try {
    // Fazer pedido através do proxy para contornar HTTP no iOS
    const res = await fetch(PROXY_URL + encodeURIComponent(apiUrl));
    const canais = await res.json();

    renderizarCanais(canais, server, user, pass);
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

    // Formato de Stream HLS do Xtream Codes (.m3u8 é suportado no iOS)
    const streamUrl = `${server}/live/${user}/${pass}/${canal.stream_id}.m3u8`;

    div.onclick = () => reproduzirStream(streamUrl);
    container.appendChild(div);
  });
}

function reproduzirStream(url) {
  const video = document.getElementById('videoPlayer');
  
  // Utilizar Proxy também no fluxo se o servidor Xtream for HTTP estrito
  const proxiedStreamUrl = PROXY_URL + encodeURIComponent(url);

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(proxiedStreamUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Suporte nativo Safari iOS
    video.src = proxiedStreamUrl;
    video.play();
  }
}