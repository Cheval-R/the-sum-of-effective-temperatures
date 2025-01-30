import { SEPARATOR } from './main.js';
import { baseTemp } from './main.js';
import { ValidateForm } from './validate.js';
import { ForecastSumEffectiveTemp } from './forecast.js'


const method = document.getElementById('method');

const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');



document
  .getElementById('location-form')
  .addEventListener('submit', (event) => {
    event.preventDefault();

    ForecastSumEffectiveTemp();
    // GetSumEffectiveTemp();

    // if (ValidateForm(event)) {
    //   console.log('Форма валидна');
    // }
    // else
    //   console.error('Форма невалидна');
  }
  );

// let startDate = new Date();

export async function GetWeather(startDate, endDate) {
  // API URL
  // const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude.value}&longitude=${longitude.value}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=Europe%2FMoscow`;
  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude.value}&longitude=${longitude.value}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m&timezone=Europe/Moscow`;


  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const weatherData = await response.json();
    if (
      !Array.isArray(weatherData.hourly.time) || weatherData.hourly.time.length === 0 ||
      !Array.isArray(weatherData.hourly.temperature_2m) || weatherData.hourly.temperature_2m.length === 0
    ) {
      throw new Error('Data is missing or corrupted');
    }
    return weatherData;
  }
  catch (error) {
    console.error('Error:', error);
    document.getElementById('temperature-sum').textContent = `Ошибка. Не удалось рассчитать эффективную температуру. 
    Попробуйте изменить параметры`;
  }
  return null;
}

async function GetSumEffectiveTemp() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  try {
    const weatherData = await GetWeather(
      DateParse(startDate, SEPARATOR),
      DateParse(endDate, SEPARATOR)
    );
    if (!weatherData) {
      throw new Error('Failed to get weather data');
    }
    const datesArray = weatherData.hourly.time;
    const temperaturesArray = weatherData.hourly.temperature_2m;

    const diffDays = CalculateDayDifference(startDate, endDate);

    // Расчёт суммы эффективных температур
    let sumEffectiveTemp = CalculateSumEffectiveTemp(datesArray, temperaturesArray, baseTemp)
    PrintResult(startDate, endDate, diffDays, sumEffectiveTemp);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('temperature-sum').textContent =
      `Ошибка. Не удалось рассчитать эффективную температуру. 
      Попробуйте изменить параметры.`;
  }
}





function func1() {
  console.log()
  // Прогноз
  if (method.value === 'on') {
    ForecastSumEffectiveTemp();
  }
  else {
    GetSumEffectiveTemp();
  }
}

// ! Вспомогательные

export function CalculateSumEffectiveTemp(datesArray, temperaturesArray, baseTemp) {
  let effectiveSum = 0;

  for (let i = 0; i < datesArray.length; i++) {
    const { nextIndex, averageTemp } =
      GetAverageTempByDay(i, datesArray, temperaturesArray)
    i = nextIndex;
    if (averageTemp > baseTemp) {
      effectiveSum += averageTemp - baseTemp;
    }
  }

  return effectiveSum;
}

function GetAverageTempByDay(index, datesArray, temperaturesArray) {
  let sum = 0, hours = 1;
  const currentDay = datesArray[index].split('T')[0]
  while (currentDay === datesArray[index + 1]?.split('T')[0]) {
    sum += temperaturesArray[index];
    index++;
    hours++;
  }
  sum += temperaturesArray[index];

  return { nextIndex: index, averageTemp: sum / hours }
}

// Вывод результата
function PrintResult(startDate, endDate, diffDays, effectiveSum) {
  document.getElementById('output').innerHTML =
    `
    <h2 class="output__title">Сумма эффективных температур:</h2>
    <p> Начиная с ${startDate} до ${endDate} за ${diffDays} дней накопилось ${effectiveSum.toFixed(2)}°C эффективных температур. </p>
    `;
}

// Изменение формата записи  с ДД.ММ.ГГГГ до ГГГГ-ММ-ДД
export function DateParse(date, separator) {
  const dateArray = date.split(separator);
  return `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`
}

function CalculateDayDifference(startDay, endDay) {
  const startDate = new Date(DateParse(startDay, '.'));
  const endDate = new Date(DateParse(endDay, '.'));

  // Вычисляем разницу в миллисекундах и преобразуем в дни
  const timeDifference = endDate - startDate;
  const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1;

  return dayDifference;
}


