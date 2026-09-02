/* ===========================================================
   API CLIMA — script.js
   Responsável por toda a lógica: capturar entrada do usuário,
   consultar as APIs da Open-Meteo, atualizar a tela e o mapa.
   =========================================================== */

// -----------------------------------------------------------
// Referências aos elementos do HTML
// -----------------------------------------------------------

const inputCidade = document.getElementById("input-cidade");
const botaoBuscar = document.getElementById("botao-buscar");
const mensagemCarregando = document.getElementById("mensagem-carregando");
const mensagemErro = document.getElementById("mensagem-erro");
const resultadoContainer = document.getElementById("resultado-container");
const cardClima = document.getElementById("card-clima");

const elClimaCidade = document.getElementById("clima-cidade");
const elClimaLocal = document.getElementById("clima-local");
const elClimaHorario = document.getElementById("clima-horario");
const elClimaIcone = document.getElementById("clima-icone");
const elClimaTemperatura = document.getElementById("clima-temperatura");
const elClimaCondicao = document.getElementById("clima-condicao");
const elClimaSensacao = document.getElementById("clima-sensacao");
const elClimaUmidade = document.getElementById("clima-umidade");
const elClimaVento = document.getElementById("clima-vento");

// -----------------------------------------------------------
// Variáveis do Mapa Interativo (Leaflet.js)
// -----------------------------------------------------------

let instanciaMapa = null;
let marcadorAtual = null;

// -----------------------------------------------------------
// URLs base das APIs (Open-Meteo, sem necessidade de chave)
// -----------------------------------------------------------

const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_CLIMA = "https://api.open-meteo.com/v1/forecast";
const CIDADE_PADRAO = "Curitiba";

// -----------------------------------------------------------
// Eventos: clique no botão e tecla Enter no campo de texto
// -----------------------------------------------------------

botaoBuscar.addEventListener("click", () => {
  pesquisarClimaDaCidade();
});

inputCidade.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    pesquisarClimaDaCidade();
  }
});

// -----------------------------------------------------------
// Função principal: orquestra todo o fluxo da busca
// -----------------------------------------------------------

async function pesquisarClimaDaCidade(nomeInformado = inputCidade.value.trim(), mensagem = "Buscando clima...") {
  const nomeCidade = nomeInformado.trim();

  // 1. Validar campo vazio
  if (nomeCidade === "") {
    exibirErro("Digite o nome de uma cidade antes de buscar.");
    return;
  }

  esconderErro();
  esconderCard();
  mensagemCarregando.textContent = mensagem;
  mostrarCarregamento(true);
  botaoBuscar.disabled = true;

  try {
    // 2. Buscar a cidade (geocoding)
    const cidadeEncontrada = await buscarCidade(nomeCidade);

    // 3. Buscar o clima usando as coordenadas da cidade
    const dadosClima = await buscarClima(
      cidadeEncontrada.latitude,
      cidadeEncontrada.longitude
    );

    // 4. Exibir tudo no card e no mapa
    exibirClima(cidadeEncontrada, dadosClima);
  } catch (erro) {
    // Qualquer erro lançado nas funções acima cai aqui
    exibirErro(erro.message);
  } finally {
    mostrarCarregamento(false);
    botaoBuscar.disabled = false;
  }
}

// -----------------------------------------------------------
// buscarCidade(nome)
// Consulta a API de geocoding e retorna a primeira cidade encontrada
// -----------------------------------------------------------

async function buscarCidade(nome) {
  const parametros = new URLSearchParams({
    name: nome,
    count: 5,
    language: "pt",
    format: "json",
  });

  let resposta;

  try {
    resposta = await fetch(`${URL_GEOCODING}?${parametros}`);
  } catch (erroDeRede) {
    throw new Error(
      "Não foi possível conectar à internet. Verifique sua conexão e tente novamente."
    );
  }

  if (!resposta.ok) {
    throw new Error("A API de busca de cidades retornou um erro. Tente novamente mais tarde.");
  }

  const dados = await resposta.json();

  // A API retorna { results: [...] } quando encontra algo,
  // ou nem inclui "results" quando não encontra nada.
  if (!dados.results || dados.results.length === 0) {
    throw new Error("Não encontramos essa cidade. Verifique o nome e tente novamente.");
  }

  // Usamos sempre a primeira correspondência, conforme pedido no projeto
  const primeiraCidade = dados.results[0];

  return primeiraCidade;
}

// -----------------------------------------------------------
// buscarClima(latitude, longitude)
// Consulta a API de previsão do tempo usando as coordenadas
// -----------------------------------------------------------

async function buscarClima(latitude, longitude) {
  const parametros = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    timezone: "auto",
  });

  let resposta;

  try {
    resposta = await fetch(`${URL_CLIMA}?${parametros}`);
  } catch (erroDeRede) {
    throw new Error(
      "Não foi possível conectar à internet. Verifique sua conexão e tente novamente."
    );
  }

  if (!resposta.ok) {
    throw new Error("A API de clima retornou um erro. Tente novamente mais tarde.");
  }

  const dados = await resposta.json();

  if (!dados.current) {
    throw new Error("A API de clima não retornou dados para essa localização.");
  }

  return dados;
}

// -----------------------------------------------------------
// interpretarCondicaoClimatica(codigo)
// Traduz o weather_code numérico da Open-Meteo em texto + emoji
// -----------------------------------------------------------

function interpretarCondicaoClimatica(codigo) {
  const condicoes = {
    0: { texto: "Céu limpo", icone: "☀️" },
    1: { texto: "Parcialmente nublado", icone: "🌤️" },
    2: { texto: "Parcialmente nublado", icone: "🌤️" },
    3: { texto: "Nublado", icone: "☁️" },
    45: { texto: "Neblina", icone: "🌫️" },
    48: { texto: "Neblina com geada", icone: "🌫️" },
    51: { texto: "Garoa leve", icone: "🌦️" },
    53: { texto: "Garoa", icone: "🌦️" },
    55: { texto: "Garoa forte", icone: "🌦️" },
    61: { texto: "Chuva leve", icone: "🌧️" },
    63: { texto: "Chuva", icone: "🌧️" },
    65: { texto: "Chuva forte", icone: "🌧️" },
    71: { texto: "Neve leve", icone: "🌨️" },
    73: { texto: "Neve", icone: "🌨️" },
    75: { texto: "Neve forte", icone: "🌨️" },
    80: { texto: "Pancadas de chuva", icone: "🌦️" },
    81: { texto: "Pancadas de chuva", icone: "🌦️" },
    82: { texto: "Pancadas de chuva fortes", icone: "⛈️" },
    95: { texto: "Tempestade", icone: "⛈️" },
  };

  // Caso o código não esteja mapeado, usamos um valor padrão
  return condicoes[codigo] || { texto: "Condição desconhecida", icone: "❓" };
}

// -----------------------------------------------------------
// exibirClima(cidade, dadosClima)
// Preenche o card e atualiza o mapa com os dados recebidos
// -----------------------------------------------------------

function exibirClima(cidade, dadosClima) {
  const atual = dadosClima.current;
  const condicao = interpretarCondicaoClimatica(atual.weather_code);

  // Nome da cidade
  elClimaCidade.textContent = cidade.name;

  // Estado/região + país (região pode não existir para todas as cidades)
  const partesLocal = [];
  if (cidade.admin1) partesLocal.push(cidade.admin1);
  if (cidade.country) partesLocal.push(cidade.country);
  elClimaLocal.textContent = partesLocal.join(", ");

  // Horário da consulta (horário local do dispositivo)
  const agora = new Date();
  elClimaHorario.textContent = `Consultado às ${agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  // Ícone e temperatura principal
  elClimaIcone.textContent = condicao.icone;
  elClimaTemperatura.textContent = `${Math.round(atual.temperature_2m)}°C`;

  // Condição climática em texto
  elClimaCondicao.textContent = condicao.texto;

  // Detalhes adicionais
  elClimaSensacao.textContent = `${Math.round(atual.apparent_temperature)}°C`;
  elClimaUmidade.textContent = `${atual.relative_humidity_2m}%`;
  elClimaVento.textContent = `${Math.round(atual.wind_speed_10m)} km/h`;

  // Exibir a seção de resultados antes de ajustar o tamanho do mapa
  mostrarCard();

  // Atualizar a localização e popup do mapa
  atualizarMapa(cidade.latitude, cidade.longitude, cidade, dadosClima);
}

// -----------------------------------------------------------
// pesquisarClimaPorCoordenadas(lat, lon)
// Orquestra o fluxo de busca de clima acionado pelo clique no mapa
// -----------------------------------------------------------

async function pesquisarClimaPorCoordenadas(lat, lon) {
  esconderErro();
  mensagemCarregando.textContent = "Buscando clima do local selecionado...";
  mostrarCarregamento(true);
  botaoBuscar.disabled = true;

  // Atualiza a posição do marcador imediatamente para dar feedback instantâneo ao usuário
  if (marcadorAtual) {
    marcadorAtual.setLatLng([lat, lon]);
  }

  try {
    // Busca a cidade (geocodificação reversa) e os dados climáticos simultaneamente
    const [cidadeEncontrada, dadosClima] = await Promise.all([
      obterCidadePorCoordenadas(lat, lon),
      buscarClima(lat, lon),
    ]);

    // Atualiza o campo de busca com o nome da nova localidade encontrada
    if (cidadeEncontrada.name && cidadeEncontrada.name !== "Local selecionado") {
      inputCidade.value = cidadeEncontrada.name;
    }

    // Exibe o card e o mapa atualizados
    exibirClima(cidadeEncontrada, dadosClima);
  } catch (erro) {
    exibirErro(erro.message);
  } finally {
    mostrarCarregamento(false);
    botaoBuscar.disabled = false;
  }
}

// -----------------------------------------------------------
// obterCidadePorCoordenadas(lat, lon)
// Realiza geocodificação reversa para encontrar o nome do local a partir das coordenadas
// -----------------------------------------------------------

async function obterCidadePorCoordenadas(lat, lon) {
  try {
    const urlBigData = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
    const resposta = await fetch(urlBigData);

    if (resposta.ok) {
      const dados = await resposta.json();
      const nomeCidade =
        dados.city ||
        dados.locality ||
        dados.principalSubdivision ||
        "Local selecionado";

      return {
        name: nomeCidade,
        admin1: dados.principalSubdivision || "",
        country: dados.countryName || "",
        latitude: lat,
        longitude: lon,
      };
    }
  } catch (erro) {
    // Se a primeira API falhar, continuamos para os fallbacks
  }

  try {
    const urlNominatim = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt`;
    const resposta = await fetch(urlNominatim, {
      headers: { "User-Agent": "API-Clima-App/1.0" },
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      const addr = dados.address || {};
      const nomeCidade =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        "Local selecionado";

      return {
        name: nomeCidade,
        admin1: addr.state || addr.region || "",
        country: addr.country || "",
        latitude: lat,
        longitude: lon,
      };
    }
  } catch (erro) {
    // Fallback final caso não haja conexão com os serviços de geocodificação
  }

  return {
    name: "Local selecionado",
    admin1: `Lat: ${parseFloat(lat).toFixed(2)}`,
    country: `Lon: ${parseFloat(lon).toFixed(2)}`,
    latitude: lat,
    longitude: lon,
  };
}

// -----------------------------------------------------------
// atualizarMapa(latitude, longitude, cidade, dadosClima)
// Gerencia a visão do mapa Leaflet, marcadores, popups e eventos
// -----------------------------------------------------------

function atualizarMapa(latitude, longitude, cidade, dadosClima) {
  if (typeof L === "undefined") return;

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const atual = dadosClima.current;
  const condicao = interpretarCondicaoClimatica(atual.weather_code);

  const conteudoPopup = `
    <div class="popup-clima">
      <h4>${cidade.name}</h4>
      <div class="popup-temp">${Math.round(atual.temperature_2m)}°C</div>
      <div class="popup-condicao">
        <span>${condicao.icone}</span>
        <span>${condicao.texto}</span>
      </div>
    </div>
  `;

  if (!instanciaMapa) {
    // 1. Inicializa a instância do Leaflet no container #map
    instanciaMapa = L.map("map").setView([lat, lon], 11);

    // 2. Adiciona os tiles do OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instanciaMapa);

    // 3. Adiciona o marcador com popup
    marcadorAtual = L.marker([lat, lon]).addTo(instanciaMapa);
    marcadorAtual.bindPopup(conteudoPopup).openPopup();

    // 4. Registra evento de clique no mapa para buscar o clima do local clicado
    instanciaMapa.on("click", (evento) => {
      const cliqueLat = evento.latlng.lat;
      const cliqueLon = evento.latlng.lng;
      pesquisarClimaPorCoordenadas(cliqueLat, cliqueLon);
    });
  } else {
    // Reutiliza a instância existente com voo suave (flyTo) e atualiza o marcador
    instanciaMapa.flyTo([lat, lon], 11, { duration: 1.2 });

    if (marcadorAtual) {
      marcadorAtual.setLatLng([lat, lon]);
      marcadorAtual.setPopupContent(conteudoPopup).openPopup();
    } else {
      marcadorAtual = L.marker([lat, lon]).addTo(instanciaMapa);
      marcadorAtual.bindPopup(conteudoPopup).openPopup();
    }
  }

  // Garante que o mapa recalcule o tamanho após renderizar a div
  setTimeout(() => {
    if (instanciaMapa) {
      instanciaMapa.invalidateSize();
    }
  }, 250);
}

// -----------------------------------------------------------
// Funções pequenas de controle de interface (mostrar/esconder)
// -----------------------------------------------------------

function mostrarCarregamento(mostrar) {
  if (mostrar) {
    mensagemCarregando.classList.remove("escondido");
  } else {
    mensagemCarregando.classList.add("escondido");
  }
}

function exibirErro(texto) {
  mensagemErro.textContent = texto;
  mensagemErro.classList.remove("escondido");
}

function esconderErro() {
  mensagemErro.textContent = "";
  mensagemErro.classList.add("escondido");
}

function mostrarCard() {
  resultadoContainer.classList.remove("escondido");
}

function esconderCard() {
  resultadoContainer.classList.add("escondido");
}

document.addEventListener("DOMContentLoaded", () => {
  pesquisarClimaDaCidade(CIDADE_PADRAO, `Carregando clima de ${CIDADE_PADRAO}...`);
});

