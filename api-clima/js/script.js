/* ===========================================================
   API CLIMA — script.js
   Responsável por toda a lógica: capturar entrada do usuário,
   consultar as APIs da Open-Meteo e atualizar a tela.
   =========================================================== */

// -----------------------------------------------------------
// Referências aos elementos do HTML
// -----------------------------------------------------------

const inputCidade = document.getElementById("input-cidade");
const botaoBuscar = document.getElementById("botao-buscar");
const mensagemCarregando = document.getElementById("mensagem-carregando");
const mensagemErro = document.getElementById("mensagem-erro");
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

    // 4. Exibir tudo no card
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
// Preenche o card com os dados recebidos das duas APIs
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

  mostrarCard();
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
  cardClima.classList.remove("escondido");
}

function esconderCard() {
  cardClima.classList.add("escondido");
}

document.addEventListener("DOMContentLoaded", () => {
  pesquisarClimaDaCidade(CIDADE_PADRAO, `Carregando clima de ${CIDADE_PADRAO}...`);
});
