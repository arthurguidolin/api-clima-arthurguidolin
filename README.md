# API Clima 🌤️ - Arthur Guidolin
Projeto simples e moderno de consulta de clima, desenvolvido com **HTML5, CSS3 e JavaScript puro (ES6+)**, sem frameworks e sem backend.
A aplicação conta com um **Mapa Interativo (Leaflet.js + OpenStreetMap)** integrado ao card de clima, permitindo visualizar a localização da cidade pesquisada e consultar o tempo clicando diretamente no mapa.
---
## 🚀 Funcionalidades
- 🔍 **Busca por cidade:** Pesquise qualquer localidade para obter dados de clima em tempo real.
- 🗺️ **Mapa Interativo:** Exibição automática da localização buscada no mapa com marcador (pin) e popup informativo.
- 📍 **Consulta por Clique no Mapa:** Clique em qualquer ponto do mapa para consultar instantaneamente a previsão do tempo daquelas coordenadas.
- 📱 **Layout Responsivo:** Interface limpa e adaptada para computadores e dispositivos móveis.
---
## 🌐 APIs e Bibliotecas Utilizadas
- **Geocoding API:** [Open-Meteo Geocoding](https://geocoding-api.open-meteo.com/v1/search) *(Gratuita / Sem API Key)*
- **Clima API:** [Open-Meteo Forecast](https://api.open-meteo.com/v1/forecast) *(Gratuita / Sem API Key)*
- **Mapa Interativo:** [Leaflet.js](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) *(Biblioteca open-source gratuita)*
---
## 🛠️ Conceitos e Aprendizados Aplicados
- Requisições HTTP assíncronas com `fetch()`.
- Manipulação de dados e respostas em formato `JSON`.
- Encadeamento de chamadas de API (Geocoding ↔ Clima / Coordenadas ↔ Clima).
- Integração de mapa interativo com gerenciamento de instâncias e eventos de clique (`map.on('click')`).
- Tratamento de erros assíncronos (`try/catch`) e feedback visual na interface.
- Manipulação dinâmica do DOM para atualização imediata dos dados.
- Organização de código limpo com funções pequenas e específicas.
- Estilização responsiva com CSS Grid e Flexbox.

## LINK 
- https://arthurguidolin.github.io/api-clima-arthurguidolin/api-clima/
