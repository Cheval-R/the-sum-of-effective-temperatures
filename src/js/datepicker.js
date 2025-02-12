import AirDatepicker from 'air-datepicker';
import { SEPARATOR } from './main.js';

const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))

const byYear = document.getElementById('by-year');

const endDateLabel = document.getElementById('end-date-label')
const endDateInput = document.getElementById('end-date');

byYear.addEventListener('change', (event) => {
  if (event.target.checked) {
    endDateLabel.style.display = 'none';
    endDateInput.value = '';
    startDatePicker.update({
      maxDate: new Date('2025-12-31')
    })
  }
  else {
    endDateLabel.style.display = 'flex';
    endDateInput.value = '';
    startDatePicker.update({
      maxDate: yesterday,
    })
  }
})
/* method.addEventListener('change', (event) => {
  if (event.target.checked) {
    byYear.disabled = true;
    byYear.checked = false;
    startDatePicker.update({
      minDate: new Date('2025-01-01')
    });
    endDateLabel.style.display = 'none';
    endDateInput.value = '';
  }
  else {
    byYear.disabled = false;
    endDateLabel.style.display = 'flex';
    endDateInput.value = '';
    startDatePicker.update({
      minDate: new Date('2021-03-23')
    });
  }
}) */
// * Инициализация календарей
let startDatePicker, endDatePicker;

startDatePicker = new AirDatepicker('#start-date',
  {
    // inline: true,
    // selectedDates: new Date('2024-01-01'),
    dateFormat: `dd${SEPARATOR}MM${SEPARATOR}yyyy`,
    minDate: new Date('2021-03-23'),
    maxDate: yesterday,
    onSelect({ date }) {
      endDatePicker.update({
        minDate: date,
      })
    }
  });


endDatePicker = new AirDatepicker('#end-date',
  {
    // selectedDates: new Date('2024-08-02'),
    // inline: true,
    dateFormat: `dd${SEPARATOR}MM${SEPARATOR}yyyy`,
    minDate: new Date('2021-03-23'),
    maxDate: yesterday,
    onSelect({ date }) {
      startDatePicker.update({
        maxDate: date,
      })
    },
  });