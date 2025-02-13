import { baseTemp } from './main.js';
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
      date: weatherData.hourly.time,
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
  const
    inputStartDate = document.getElementById('start-date').value,
    apiStartDate = DateParse(inputStartDate);
  let apiEndDate;
  // Если расчёт на год активирован то нам нужно сгенерировать конечную дату расчёта (31.12.202Х)
  if (byYear.checked) {
    let
      selectedYear = new Date(apiStartDate).getFullYear(),
      currentYear = new Date().getFullYear();
    // Если выбранная дата находится в текущем году, то вызываем функцию прогноза
    if (selectedYear === currentYear) {
      ForecastSumEffectiveTemp(); // Переделать структуру
      return
    } else {
      // Иначе задаём конечную дату с заданным годом
      apiEndDate = `${selectedYear}-12-31`;
    }
  }
  else {
    // Если расчёт на год не активирован, то берем конечную дату из инпута
    const inputEndDate = document.getElementById('end-date').value;
    apiEndDate = DateParse(inputEndDate);
  }
  try {
    const weatherData = await GetWeather(apiStartDate, apiEndDate);
    if (!weatherData) {
      throw new Error('Failed to get weather data');
    }
    console.log('weatherData', weatherData)
    // Расчёт суммы эффективных температур
    let [sumEffectiveTemp, totalAverageData] =
      CalculateSumEffectiveTemp(weatherData, 0);
    console.log('totalAverageData', totalAverageData)
    const lastCountDate = totalAverageData.date.at(-1),
      calculationDurationDays = totalAverageData.date.length;

    PrintGraph(totalAverageData);
    PrintResult(inputStartDate, lastCountDate, calculationDurationDays, sumEffectiveTemp);
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
// datesArray  temperaturesArray это два массива одного и того же объекта
// Basetemp - сделать глобальным объектом
// stopTemp зависит от byyear, checked => 950 else infinity
export function CalculateSumEffectiveTemp(data, sumEffectiveTemp = 0, stopTemp = Infinity, forecastFlag = false) {
  console.log(data)
  const date = [], temp = [];
  // && sumEffectiveTemp <= stopTemp
  for (let index = 0; index < data.date.length; index++) {
    const { nextIndex, averageTemp } =
      GetAverageTempByDay(index, data)
    index = nextIndex

    if (averageTemp > baseTemp) {
      sumEffectiveTemp += averageTemp - baseTemp;
    }
    temp.push(sumEffectiveTemp);

    let currentDate = new Date(data.date[index]);
    if (forecastFlag) {
      const currentYear = new Date().getFullYear();
      currentDate.setFullYear(currentYear);
    }
    date.push(currentDate.toLocaleDateString('ru-RU'));
  }
  return [sumEffectiveTemp, { temp, date }];
}

export function GetAverageTempByDay(index, data) {
  let sum = 0, hours = 1;
  const currentDay = data.date[index].split('T')[0]
  while (currentDay === data.date[index + 1]?.split('T')[0]) {
    sum += data.temp[index];
    index++;
    hours++;
  }
  sum += data.temp[index];

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
export function DateParse(date) {
  const [day, month, year] = date.split('.');
  return `${year}-${month}-${day}`;
}


export function ParseToRusDate(date) {
  return new Date(date).toLocaleDateString('ru-RU')
}