import AirDatepicker from 'air-datepicker';
import { SEPARATOR } from './main.js';
// * Инициализация календарей
let startDatePicker, endDatePicker;

startDatePicker = new AirDatepicker('#start-date',
  {
    // inline: true,
    selectedDates: new Date('2025-01-01'),
    dateFormat: `dd${SEPARATOR}MM${SEPARATOR}yyyy`,
    minDate: new Date('2021-03-23'),
    maxDate: new Date(),
    onSelect({ date }) {
      endDatePicker.update({
        minDate: date,
      })
    }
  });


endDatePicker = new AirDatepicker('#end-date',
  {
    selectedDates: new Date(),
    // inline: true,
    dateFormat: `dd${SEPARATOR}MM${SEPARATOR}yyyy`,
    minDate: new Date('2021-03-23'),
    maxDate: new Date(),
    onSelect({ date }) {
      startDatePicker.update({
        maxDate: date,
      })
    },
  });