import { SEPARATOR, baseTemp } from './main.js';
import { DateParse, GetWeather, CalculateSumEffectiveTemp, ParseToRusDate } from './weather.js';
import { PrintGraph } from './graph.js';

const
  currentYear = new Date().getFullYear(),
  minDate = new Date('2021-03-21');


export async function ForecastSumEffectiveTemp() {
  const startDate = DateParse(document.getElementById('start-date').value, SEPARATOR);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const endDate = yesterday.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  try {
    const weatherData = await GetWeather(startDate, endDate);
    if (!weatherData) {
      throw new Error('Failed to get weather data');
    }

    const
      datesArray = weatherData.time,
      temperaturesArray = weatherData.temp;
    let [sumEffectiveTemp, currentAverageData] =
      CalculateSumEffectiveTemp(datesArray, temperaturesArray, baseTemp);

    const lastCountDate = ParseToRusDate(currentAverageData.date.at(-1));
    console.log(currentAverageData.date.at(-1))
    document.getElementById('output').innerHTML =
      `
      <p>Со дня сева ${ParseToRusDate(startDate)} на сегодняшний день ${currentAverageData.date.at(-1)} накопилось ${sumEffectiveTemp}°C эффективных температур.</p>
      `

    // Прогноз
    if (sumEffectiveTemp < 950) {
      const nextDate = new Date(endDate);
      nextDate.setDate((nextDate.getDate() + 1));

      const nextDateMonth = nextDate.toLocaleString('en-CA', { month: '2-digit' }); // Месяц с ведущим нулём
      const nextDateDay = nextDate.toLocaleString('en-CA', { day: '2-digit' }); // День с ведущим нулём

      const forecastStartDate = `-${nextDateMonth}-${nextDateDay}`;
      const forecastEndDate = '-12-31';

      // Делаем запросы на погоду
      const historicWeatherData = await GetHistoricWeather(nextDate.getFullYear(), forecastStartDate, forecastEndDate);
      const predictedData = {
        date: historicWeatherData.date,
      };
      predictedData.temp = await ForecastNextYearWithRegression(historicWeatherData);

      const [sumEffectiveTemp, predictedAverageData] =
        CalculateSumEffectiveTemp(predictedData.date, predictedData.temp, baseTemp, 950, true);
      console.log(predictedAverageData.date)


      const totalDateArray = currentAverageData.date.concat(predictedAverageData.date);

      const totalWeatherData = {
        date: currentAverageData.date.concat(predictedAverageData.date),
        temp: currentAverageData.temp.concat(predictedAverageData.temp),
      }
      PrintGraph(totalWeatherData);

      let currentDate = new Date(totalDateArray.at(-1));
      currentDate.setFullYear(currentYear)
      currentDate = currentDate.toLocaleDateString('ru-RU')

      document.getElementById('output').innerHTML +=
        `
        <p>Предполагаемая дата накопления 950°C ${currentDate}.</p>
        `;

    }
  }
  catch (error) {
    console.error('Error:', error);
  }
}


async function GetHistoricWeather(currentYear, forecastStartDate, forecastEndDate) {
  const startYearLeapFlag = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;
  const minYear = minDate.getFullYear();
  const historicWeatherData = {};
  let isDateWritten = false;

  const years = [];
  while (currentYear > minYear) {
    currentYear--;
    years.push(currentYear);
  }

  // 🔥 Ограничиваем количество параллельных запросов (batch по 5)
  const batchSize = 5;
  const weatherDataMap = new Map();

  for (let i = 0; i < years.length; i += batchSize) {
    const batchYears = years.slice(i, i + batchSize);
    const batchPromises = batchYears.map(year => {
      const startDate = year + forecastStartDate;
      const endDate = year + forecastEndDate;
      return GetWeather(startDate, endDate).then(data => ({ year, data })).catch(() => null);
    });

    const results = await Promise.all(batchPromises);

    results.forEach(result => {
      if (result && result.data) {
        weatherDataMap.set(result.year, result.data);
      }
    });
  }

  for (const [year, weatherData] of weatherDataMap) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    if (isLeapYear) {
      weatherData.temp.splice(-24); // Мутируем массив вместо slice()

      if (startYearLeapFlag && !isDateWritten) {
        weatherData.time.splice(-24);
        historicWeatherData.date = weatherData.time;
        isDateWritten = true;
      }
    } else if (!startYearLeapFlag && !isDateWritten) {
      historicWeatherData.date = weatherData.time;
      isDateWritten = true;
    }

    historicWeatherData[`weatherData${year}`] = weatherData.temp;
  }

  return historicWeatherData;
}


async function ForecastNextYearWithRegression(historicWeatherData) {
  const years = Object.keys(historicWeatherData)
    .filter(key => key.startsWith("weatherData"))
    .map(key => parseInt(key.replace("weatherData", ""), 10));

  if (years.length < 2) {
    throw new Error("Недостаточно данных для прогноза. Требуется минимум 2 года.");
  }

  const numDays = historicWeatherData.date.length;
  const predictedTemperatures = new Array(numDays);
  const maxYear = Math.max(...years);
  const nextYear = maxYear + 1;

  // Предварительно создаем массив данных по дням
  const weatherMatrix = years.map(year => historicWeatherData[`weatherData${year}`]);

  for (let day = 0; day < numDays; day++) {
    const y = weatherMatrix.map(row => row[day]); // Температуры по дням
    const { slope, intercept } = LinearRegression(years, y);
    predictedTemperatures[day] = Math.round(slope * nextYear + intercept);
  }

  return predictedTemperatures;
}

// Оптимизированная линейная регрессия
function LinearRegression(x, y) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    throw new Error("Ошибка в вычислениях линейной регрессии.");
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}