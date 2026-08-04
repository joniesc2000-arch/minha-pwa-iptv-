const PROXY_URL = "https://iptv-proxy-vercel.vercel.app/?url=";

// Restaura os dados guardados assim que a PWA abre
window.addEventListener('DOMContentLoaded', () => {
  const savedServer = localStorage.getItem('iptv_server');
  const savedUser = localStorage.getItem('iptv_user');
  const savedPass = localStorage.getItem('iptv_pass');

  if (savedServer) document.getElementById('server').value = savedServer;
  if (savedUser) document.getElementById('username').value = savedUser;
  if (savedPass) document.getElementById('password').value = savedPass;
});

// Guarda os dados no localStorage
function salvarCredenciais(server, user, pass) {
  localStorage.setItem('iptv_server', server);
  localStorage.setItem('iptv_user', user);
  localStorage.setItem('iptv_pass', pass);
}

async function carregarCanais() {
 let server = document.getElementById('server').value.trim().replace(/\/+$/, '');
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha todos os campos.");
    return;
  }

  // Guarda as credenciais para não ter de digitar novamente
  salvarCredenciais(server, user, pass);

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
  window.location.href = "vlc://" + url;
}

async function exportarListaParaVLC() {
  let server = document.getElementById('server').value.trim().replace(/\/+$/, '');
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (!server || !user || !pass) {
    alert("Preencha o Servidor, Utilizador e Palavra-passe primeiro.");
    return;
  }

  salvarCredenciais(server, user, pass);

  // Constrói o URL da lista completa M3U
  const m3uUrl = `${server}/get.php?username=${user}&password=${pass}&type=m3u_plus&output=ts`;

  // Cria um conteúdo M3U apontando para a lista remota
  const m3uContent = `#EXTM3U\n#EXTINF:-1,Lista IPTV Xtream\n${m3uUrl}`;
  
  // Cria um ficheiro virtual .m3u8 no dispositivo
  const blob = new Blob([m3uContent], { type: 'application/x-mpegurl' });
  const file = new File([blob], "lista_iptv.m3u8", { type: 'application/x-mpegurl' });

  // Tenta abrir o menu de partilha nativo do iOS
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Lista IPTV',
        text: 'Importar lista para o VLC'
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Erro ao partilhar:", err);
      }
    }
  } else {
    // Fallback para download direto caso a partilha não seja suportada
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "lista_iptv.m3u8";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
