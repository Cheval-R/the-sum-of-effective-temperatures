import { SEPARATOR } from './main.js';
import { baseTemp } from './main.js';

import { DateParse } from './weather.js';
import { GetWeather } from './weather.js';
import { CalculateSumEffectiveTemp } from './weather.js';

const minDate = new Date('2021-03-21');


export async function ForecastSumEffectiveTemp() {
  let sumEffectiveTemp = 0;
  const startDate = DateParse(document.getElementById('start-date').value, SEPARATOR);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const endDate = yesterday.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  try {
    const currentData = await GetWeather(startDate, endDate);
    if (!currentData) {
      throw new Error('Failed to get weather data');
    }

    const datesArray = currentData.hourly.time;
    const temperaturesArray = currentData.hourly.temperature_2m;

    sumEffectiveTemp = CalculateSumEffectiveTemp(datesArray, temperaturesArray, baseTemp)
    // Прогноз
    if (sumEffectiveTemp < 900) {
      const nextDate = new Date(endDate);
      nextDate.setDate((nextDate.getDate() + 1));

      const nextDateMonth = nextDate.toLocaleString('en-CA', { month: '2-digit' }); // Месяц с ведущим нулём
      const nextDateDay = nextDate.toLocaleString('en-CA', { day: '2-digit' }); // День с ведущим нулём

      const forecastStartDate = `-${nextDateMonth}-${nextDateDay}`;
      const forecastEndDate = '-12-31';

      // Делаем запросы на погоду

      const historicWeatherData = await GetHistoricWeather(nextDate.getFullYear(), forecastStartDate, forecastEndDate);

      console.log(historicWeatherData);


    }
  }
  catch (error) {
    console.error('Error:', error);
  }
}


async function GetHistoricWeather(currentYear, forecastStartDate, forecastEndDate) {
  const
    startYearLeapFlag = currentYear % 4 === 0 ? true : false,
    minYear = minDate.getFullYear(),
    historicWeatherData = {};

  let
    isDateWritten = false,
    weatherData;

  while (minYear <= --currentYear) {
    const
      startDate = currentYear + forecastStartDate,
      endDate = currentYear + forecastEndDate,
      currentYearLeapFlag = currentYear % 4 === 0 ? true : false;

    try {
      weatherData = await GetWeather(startDate, endDate);
      if (!weatherData) {
        throw new Error('Failed to get weather data');
      }

      // Если год високосный
      if (currentYearLeapFlag) {
        weatherData.hourly.temperature_2m.length = weatherData.hourly.temperature_2m.length - 24; // удаляем последний день

        if (startYearLeapFlag && !isDateWritten) {
          weatherData.hourly.time.length = weatherData.hourly.time.length - 24; // удаляем последний день
          historicWeatherData.date = weatherData.hourly.time;
          isDateWritten = true;
        }
      }
      else if (!startYearLeapFlag && !isDateWritten) {
        historicWeatherData.date = weatherData.hourly.time;
        isDateWritten = true
      }

      historicWeatherData[`weatherData${currentYear}`] = weatherData.hourly.temperature_2m;

    }
    catch (error) {
      console.error('Error:', error);
    }
  }
  console.log(historicWeatherData)
  const predictedTemperatures = await ForecastNextYearWithRegression(historicWeatherData);

  console.log('Прогнозируемые температуры на следующий год:', predictedTemperatures);
  return historicWeatherData
}

async function ForecastNextYearWithRegression(historicWeatherData) {
  const years = Object.keys(historicWeatherData).filter(key => key.startsWith("weatherData"));

  if (years.length < 2) {
    throw new Error("Недостаточно данных для прогноза. Требуется минимум 2 года.");
  }

  const numDays = historicWeatherData.date.length;
  const predictedTemperatures = new Array(numDays).fill(0);

  for (let day = 0; day < numDays; day++) {
    const x = []; // Годы
    const y = []; // Температуры

    years.forEach(yearKey => {
      const year = parseInt(yearKey.replace("weatherData", ""));
      x.push(year);
      y.push(historicWeatherData[yearKey][day]);
    });

    // Вычисляем коэффициенты линейной регрессии
    const { slope, intercept } = linearRegression(x, y);

    // Делаем прогноз на следующий год
    const nextYear = Math.max(...x) + 1;
    predictedTemperatures[day] = (slope * nextYear + intercept).toFixed(2);
  }

  return predictedTemperatures;
}

// Функция для вычисления коэффициентов линейной регрессии (метод наименьших квадратов)
function linearRegression(x, y) {
  const n = x.length;
  const sumX = x.reduce((acc, val) => acc + val, 0);
  const sumY = y.reduce((acc, val) => acc + val, 0);
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}


