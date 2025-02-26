import AirDatepicker from 'air-datepicker';
import { byPeriod } from './main.js';

const
  yesterday = new Date(new Date().setDate(new Date().getDate() - 1)),
  endDateLabel = document.getElementById('end-date-label'),
  endDateInput = document.getElementById('end-date');

byPeriod.addEventListener('change', (event) => {
  if (event.target.checked) {
    endDateLabel.style.display = 'flex';
    endDateInput.value = '';
    startDatePicker.update({
      maxDate: yesterday,
    })
  }
  else {
    endDateLabel.style.display = 'none';
    endDateInput.value = '';
    startDatePicker.update({
      maxDate: new Date('2025-12-31')
    })
  }
})

// * Инициализация календарей
let startDatePicker, endDatePicker;

startDatePicker = new AirDatepicker('#start-date',
  {
    // inline: true,
    // selectedDates: new Date('2024-01-01'),
    dateFormat: 'dd.MM.yyyy',
    minDate: new Date('2021-03-23'),
    maxDate: new Date('2025-12-31'),
    onSelect({ date }) {
      endDatePicker.update({
        minDate: date,
      })
    }
  });


endDatePicker = new AirDatepicker('#end-date',
  {
    dateFormat: 'dd.MM.yyyy',
    minDate: new Date('2021-03-23'),
    maxDate: yesterday,
    onSelect({ date }) {
      startDatePicker.update({
        maxDate: date,
      })
    },
  });