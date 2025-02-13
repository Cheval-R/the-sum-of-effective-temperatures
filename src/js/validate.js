import { marker, map } from './map.js';


const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');

latitude.addEventListener('change', (event) => {
  marker.update({
    coordinates: [latitude.value, longitude.value]
  });
  map.update({
    location: {
      center: [latitude.value, longitude.value],
    }
  })
})
longitude.addEventListener('change', (event) => {
  marker.update({
    coordinates: [latitude.value, longitude.value]
  });
  map.update({
    location: {
      center: [latitude.value, longitude.value],
    }
  })
})

const farmName = document.getElementById('farm-name');
const clientName = document.getElementById('client-name');
const hybrid = document.getElementById('client-hybrid');
const phone = document.getElementById('phone');

document.getElementById('demo').addEventListener('click', (event) => {
  farmName.value = 'ТатАгрохимсервис'
  clientName.value = 'Ренат'
  hybrid.value = 'Эмелин'
  phone.value = '+79876543210'
})




