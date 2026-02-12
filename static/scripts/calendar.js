document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: window.calendarEvents || [],  // ← CAMBIO AQUÍ: de Flask via Jinja
    dateClick: function(info) {  // ← Opcional: para crear al clicar
      const title = prompt('Título del evento:');
      if (title) {
        // Redirige a tu form POST (como /events o /tasques)
        window.location.href = `/events?titol=${encodeURIComponent(title)}&data=${info.dateStr}`;
      }
    }
  });

  calendar.render();

  fetch('http://127.0.0.1:5000/api/dades')
    .then(response => response.json())
    .then(dades => {
        console.log(dades);
        // Utilitza les dades aquí
    })
    .catch(error => console.error('Error:', error));
});