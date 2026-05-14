// DASHBOARD
fetch('./components/dashboard.html')
    .then(response => response.text())
    .then(data => {

        document.getElementById('dashboard-component').innerHTML = data;

        // REINICIAR TRADINGVIEW
        const script = document.createElement('script');
        script.src = './js/tradingview.js';
        document.body.appendChild(script);
    });


// CALENDARIO
fetch('./components/calendar.html')
    .then(response => response.text())
    .then(data => {

        document.getElementById('calendar-component').innerHTML = data;

    });