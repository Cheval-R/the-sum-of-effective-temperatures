import { SEPARATOR, baseTemp } from './main.js';
import { ValidateForm } from './validate.js';
import { ForecastSumEffectiveTemp } from './forecast.js'
import { PrintGraph } from './graph.js';


const method = document.getElementById('method');
const byYear = document.getElementById('by-year');

const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');



document
  .getElementById('location-form')
  .addEventListener('submit', (event) => {
    event.preventDefault();

    if (ValidateForm(event)) {
      GetSumEffectiveTemp();
    }
  });

export async function GetWeather(startDate, endDate) {
  // API URL
  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude.value}&longitude=${longitude.value}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=Europe%2FMoscow`;
  // const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude.value}&longitude=${longitude.value}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m&timezone=Europe/Moscow`;


  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const weatherData = await response.json();
    if (
      !Array.isArray(weatherData.hourly.time) ||
      !Array.isArray(weatherData.hourly.temperature_2m) ||
      weatherData.hourly.time.length === 0 ||
      weatherData.hourly.temperature_2m.length === 0
    ) {
      throw new Error('Data is missing or corrupted');
    }
    return {
      time: weatherData.hourly.time,
      temp: weatherData.hourly.temperature_2m,
    };
  }
  catch (error) {
    console.error('Error:', error);
    document.getElementById('temperature-sum').textContent =
      `Ошибка. Не удалось рассчитать эффективную температуру. 
    Попробуйте изменить параметры`;
  }
  return null;
}

async function GetSumEffectiveTemp() {
  const startDate = document.getElementById('start-date').value;
  const apiStartDate = DateParse(startDate, SEPARATOR);
  let endDate, apiEndDate;
  if (byYear.checked) {
    let selectedYear = new Date(apiStartDate).getFullYear();
    let currentYear = new Date().getFullYear();
    if (selectedYear === currentYear) {
      ForecastSumEffectiveTemp();
      return
    } else {
      endDate = `${selectedYear}-12-31`;
    }
    apiEndDate = endDate;
  }
  else {
    endDate = document.getElementById('end-date').value;
    apiEndDate = DateParse(endDate, SEPARATOR);
  }

  try {
    const weatherData = await GetWeather(
      apiStartDate,
      apiEndDate
    );
    if (!weatherData) {
      throw new Error('Failed to get weather data');
    }

    // Расчёт суммы эффективных температур
    let [sumEffectiveTemp, totalAverageData] =
      CalculateSumEffectiveTemp(
        weatherData.time,
        weatherData.temp,
        baseTemp);

    const lastCountDate = totalAverageData.date.at(-1),
      calculationDurationDays = totalAverageData.date.length;

    PrintResult(startDate, lastCountDate, calculationDurationDays, sumEffectiveTemp);

    PrintGraph(totalAverageData);

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('temperature-sum').textContent =
      `Ошибка. Не удалось рассчитать эффективную температуру. 
      Попробуйте изменить параметры.`;
  }
}

// ! Вспомогательные

export function CalculateSumEffectiveTemp(datesArray, temperaturesArray, baseTemp, stopTemp = Infinity, forecastFlag = false) {
  const date = [], temp = [];

  let sumEffectiveTemp = 0;

  for (let index = 0; index < datesArray.length && sumEffectiveTemp <= stopTemp; index++) {
    const { nextIndex, averageTemp } =
      GetAverageTempByDay(index, datesArray, temperaturesArray)
    index = nextIndex

    if (averageTemp > baseTemp) {
      sumEffectiveTemp += averageTemp - baseTemp;
    }
    temp.push(sumEffectiveTemp);

    let currentDate = new Date(datesArray[index]);
    if (forecastFlag) {
      const currentYear = new Date().getFullYear();
      currentDate.setFullYear(currentYear);
    }
    date.push(currentDate.toLocaleDateString('ru-RU'));
  }
  return [sumEffectiveTemp, { temp, date }];
}

export function GetAverageTempByDay(index, datesArray, temperaturesArray) {
  let sum = 0, hours = 1;
  const currentDay = datesArray[index].split('T')[0]
  while (currentDay === datesArray[index + 1]?.split('T')[0]) {
    sum += temperaturesArray[index];
    index++;
    hours++;
  }
  sum += temperaturesArray[index];

  return { nextIndex: index, averageTemp: (sum / hours).toFixed(0) }
}

// Вывод результата
function PrintResult(startDate, endDate, diffDays, effectiveSum) {
  document.getElementById('output').innerHTML =
    `
    <h2 class="output__title">Сумма эффективных температур:</h2>
    <p> Начиная с ${startDate} до ${endDate} за ${diffDays} дней накопилось ${effectiveSum.toFixed(0)}°C эффективных температур. </p>
    `;
}

// Изменение формата записи  с ДД.ММ.ГГГГ до ГГГГ-ММ-ДД
export function DateParse(date, separator) {
  const dateArray = date.split(separator);
  return `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`
}

export function ParseToRusDate(date) {
  return new Date(date).toLocaleDateString('ru-RU')
}

/* function CalculateDayDifference(startDay, endDay) {
  const startDate = new Date(DateParse(startDay, '.'));
  const endDate = new Date(DateParse(endDay, '.'));

  // Вычисляем разницу в миллисекундах и преобразуем в дни
  const timeDifference = endDate - startDate;
  const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1;

  return dayDifference;
} */




