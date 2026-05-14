const chartContainer = document.getElementById("tradingview-chart");

if (chartContainer) {
    chartContainer.innerHTML = `
        <iframe
            src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=240&theme=dark&style=1&locale=es"
            width="100%"
            height="100%"
            frameborder="0"
            allowtransparency="true"
            scrolling="no">
        </iframe>
    `;
}