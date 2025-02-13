import JustValidate from 'just-validate';
import Inputmask from "inputmask/dist/inputmask.es6.js";
import { GetSumEffectiveTemp } from './weather.js';

export const SEPARATOR = '.';
export const baseTemp = parseFloat(document.getElementById('base-temp').value);
export const chartObj = { chart: null };

// Всё начинается с Валидации
const byYear = document.getElementById('by-year');


const telMask = new Inputmask('+7 (999) 999-99-99', { "placeholder": "+7 (***) ***-**-**" });
telMask.mask(phone);

const validate = new JustValidate('#location-form');

validate
  .addField('#farm-name', [
    {
      rule: "required",
      errorMessage: 'Введите название',
    },
    {
      validator: (value) => {
        return value !== undefined && value.length > 3;
      },
      errorMessage: 'Минимум 4 буквы',
    },
  ])
  .addField('#client-name', [
    {
      rule: "required",
      errorMessage: 'Введите ваше имя',
    },
    {
      validator: (value) => {
        return value !== undefined && value.length >= 2;
      },
      errorMessage: 'Минимум 2 буквы',
    },
  ])
  .addField('#client-hybrid', [
    {
      rule: "required",
      errorMessage: 'Введите гибрид',
    },
    {
      validator: (value) => {
        return value !== undefined && value.length >= 3;
      },
      errorMessage: 'Минимум 3 буквы',
    },
  ])
  .addField('#phone', [
    {
      rule: 'required',
      errorMessage: 'Введите телефон',
    },
    {
      validator(value) {
        const phoneNumber = phone.inputmask.unmaskedvalue();
        return !!(Number(phoneNumber) && phoneNumber.length === 10);
      },
      errorMessage: 'Некорректный номер',
    },
  ])
  .addField('#start-date', [
    {
      rule: 'required',
      errorMessage: 'Выберите дату'
    }
  ])
  .addField('#end-date', [
    {
      validator: (value) => {
        if (byYear.checked) return true; // Если флаг false — пропускаем валидацию
        return value.trim() !== ''; // Если флаг true — проверяем, заполнено ли поле
      },
      errorMessage: 'Выберите дату',
    },
  ])
  .addField('#latitude', [
    {
      rule: 'required',
      errorMessage: 'Введите широту'
    },
    {
      validator: (value) => !isNaN(value) && value >= -90 && value <= 90,
      errorMessage: 'От -90 до 90'
    }
  ])
  .addField('#longitude', [
    {
      rule: 'required',
      errorMessage: 'Введите долготу'
    },
    {
      validator: (value) => !isNaN(value) && value >= -180 && value <= 180,
      errorMessage: 'От -180 до 180'
    }
  ])
  .onSuccess(event => {
    event.preventDefault();
    // Запуск основной функции программы
    GetSumEffectiveTemp();
  })