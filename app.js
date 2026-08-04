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
  const server = document.getElementById('server').value.trim();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha todos os campos.");
    return;
  }

  const apiUrl = `${server}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`;
  const proxiedApiUrl = PROXY_URL + encodeURIComponent(apiUrl);

  try {
    const response = await fetch(proxiedApiUrl);
    const data = await response.json();

    if (Array.isArray(data)) {
      renderizarCanais(data, server, user, pass);
    } else {
      alert("Erro ao obter lista de canais. Verifique os dados de acesso.");
    }
  } catch (err) {
    console.error(err);
    alert("Falha na ligação ao servidor.");
  }
}

function renderizarCanais(canais, server, user, pass) {
  const container = document.getElementById('channels');
  container.innerHTML = '';

  canais.forEach(canal => {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.innerText = canal.name;

    const streamUrl = `${server}/live/${user}/${pass}/${canal.stream_id}.ts`;

    div.onclick = () => reproduzirStream(streamUrl);
    container.appendChild(div);
  });
}

function reproduzirStream(url) {
  // Abre o fluxo diretamente no leitor do VLC
  window.location.href = "vlc://" + url;
}

// Nova função para enviar a lista M3U completa diretamente para o VLC
async function exportarListaParaVLC() {
  const server = document.getElementById('server').value.trim();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha o Servidor, Utilizador e Palavra-passe primeiro.");
    return;
  }

  // O próprio Xtream Codes converte a conta num ficheiro M3U completo através desta URL:
  const m3uUrl = `${server}/get.php?username=${user}&password=${pass}&type=m3u_plus&output=ts`;

  try {
    // Pede ao servidor Xtream a lista completa de canais
    const response = await fetch(m3uUrl);
    const data = await response.blob();
    const file = new File([data], "lista_iptv.m3u", { type: "audio/x-mpegurl" });

    // Abre o menu de partilha do iPhone para enviar diretamente para a app do VLC
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Lista IPTV',
        text: 'Importar para o VLC'
      });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(data);
      a.download = "lista_iptv.m3u";
      a.click();
    }
  } catch (err) {
    alert("Erro ao gerar a lista do Xtream. Verifique os dados de acesso.");
  }
}
