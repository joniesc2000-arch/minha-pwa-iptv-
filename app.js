const PROXY_URL = "https://iptv-proxy-vercel.vercel.app/?url=";

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
      alert("Credenciais incorretas.");
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

    // Força o formato .m3u8 para o WebKit (iOS)
    const streamUrl = `${server}/live/${user}/${pass}/${canal.stream_id}.m3u8`;

    div.onclick = () => reproduzirStream(streamUrl);
    container.appendChild(div);
  });
}

function reproduzirStream(url) {
  const video = document.getElementById('videoPlayer');
  const proxiedUrl = PROXY_URL + encodeURIComponent(url);

  // Atributos para o leitor HTML5 no Safari móvel
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  
  video.pause();
  video.src = proxiedUrl;
  video.load();
  
  video.play().catch(err => {
    console.log("Erro ao dar play nativo:", err);
  });
}
function reproduzirM3u8Direto() {
  const urlInput = document.getElementById('m3u8Url').value.trim();

  if (!urlInput) {
    alert("Por favor, insira um link M3U8 válido.");
    return;
  }

  // Se o link for HTTP, passa pelo proxy Vercel para garantir HTTPS no iOS
  let streamUrl = urlInput;
  if (streamUrl.startsWith('http://')) {
    streamUrl = PROXY_URL + encodeURIComponent(streamUrl);
  }

  const video = document.getElementById('videoPlayer');
  
  video.pause();
  video.removeAttribute('src');

  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');

  video.src = streamUrl;
  video.load();

  video.play().catch(err => {
    console.log("Erro ao iniciar reprodução nativa:", err);
  });
}
