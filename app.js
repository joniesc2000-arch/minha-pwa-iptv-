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

    // Pedimos a playlist .m3u8 (o Worker encarregar-se-á de reescrever os .ts para HTTPS)
    const streamUrl = `${server}/live/${user}/${pass}/${canal.stream_id}.m3u8`;

    div.onclick = () => reproduzirStream(streamUrl);
    container.appendChild(div);
  });
}

function reproduzirStream(url) {
  const video = document.getElementById('videoPlayer');
  const proxiedUrl = PROXY_URL + encodeURIComponent(url);

  video.pause();
  video.removeAttribute('src'); // Limpa a fonte anterior
  
  // Atributos cruciais para o Safari iOS
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  
  video.src = proxiedUrl;
  video.load();
  
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log("Autoplay bloqueado ou erro de leitor:", error);
    });
  }
}
