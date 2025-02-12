import { SEPARATOR, baseTemp } from './main.js';
import { ForecastSumEffectiveTemp } from './forecast.js'
import { PrintGraph } from './graph.js';


const byYear = document.getElementById('by-year');

const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');

export async function GetWeather(startDate, endDate) {
  // API URL
  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude.value}&longitude=${longitude.value}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=Europe%2FMoscow`;


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

export async function GetSumEffectiveTemp() {
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
        baseTemp, 0);

    const lastCountDate = totalAverageData.date.at(-1),
      calculationDurationDays = totalAverageData.date.length;

    PrintGraph(totalAverageData);
    PrintResult(startDate, lastCountDate, calculationDurationDays, sumEffectiveTemp);
    OptimalHarvestingTiming(totalAverageData);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('temperature-sum').textContent =
      `Ошибка. Не удалось рассчитать эффективную температуру. 
      Попробуйте изменить параметры.`;
  }
}

// ! Вспомогательные
export function OptimalHarvestingTiming(data) {
  const dataset = data.temp;
  let
    xMinIndex = null,
    xMaxIndex = null;

  dataset.forEach((value, index) => {
    if (value >= 850 && value <= 950) {
      if (xMinIndex === null) xMinIndex = index;
      xMaxIndex = index;
    }
  });

  if (xMinIndex !== null && xMaxIndex !== null) {
    let
      startDate = data.date[xMinIndex],
      endDate = data.date[xMaxIndex];
    document.getElementById('output').style.display = 'block'
    document.getElementById('output__optimal').innerHTML =
      `
      Оптимальный срок уборки кукурузы на силос с <u>${startDate}</u> до <u>${endDate}</u>
      `;
  }
  else {
    document.getElementById('output__optimal').innerHTML =
      `
      Оптимальные сроки уборки кукурузы на силос <b>не определены</b>
      `;
  }
}

export function CalculateSumEffectiveTemp(datesArray, temperaturesArray, baseTemp, sumEffectiveTemp = 0, stopTemp = Infinity, forecastFlag = false) {
  const date = [], temp = [];


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
  document.getElementById('output').style.display = 'block'
  document.getElementById('output__sum').innerHTML =
    `
    Начиная с <u>${startDate}</u> до <u>${endDate}</u> за ${diffDays} дней накопилось ${effectiveSum.toFixed(0)}°C эффективных температур.
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