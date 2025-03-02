import {
  GetWeather,
  CalculateSumEffectiveTemp,
  CalculateByPeriod
} from './weather.js';
const MIN_DATE = new Date('2021-03-21');

Date.prototype.withoutTime = function () {
  let d = new Date(this);
  d.setHours(0, 0, 0, 0);
  return d; // Вернуть объект даты без информации о времени
};

export async function CalculateByYear(dateRangeData) {
  try {
    if (IsPreviousDays(dateRangeData.startDateMinus)) {
      console.log(dateRangeData, 'dateRangeData')
      const weatherData = await CalculateByPeriod(dateRangeData);
      if (!weatherData) {
        throw new Error('Не удалось получить погодные данные. Попробуйте позже или измените параметры');
      }
      if (weatherData.sumEffectiveTemp < 850) {
        const predictedData = await Prediction(weatherData, dateRangeData.endDateMinus)
        return predictedData;
      }
      else {
        return weatherData
      }
    }
    else {
      const predictedData = await Prediction({ date: [], temp: [], sumEffectiveTemp: 0 }, dateRangeData.startDateMinus);
      return predictedData
    }
  } catch (error) {
    console.error('Error:', error);
    return null
  }
}

async function GetPredictedData(nextDate, weatherData) {
  const
    nextDateMonth = nextDate.toLocaleString('en-CA', { month: '2-digit' }),
    nextDateDay = nextDate.toLocaleString('en-CA', { day: '2-digit' }),
    forecastStartDate = `-${nextDateMonth}-${nextDateDay}`,
    forecastEndDate = '-12-31';
  // Делаем запросы погоды
  try {
    const historicWeatherData = await GetHistoricWeather(nextDate.getFullYear(), forecastStartDate, forecastEndDate);
    if (!historicWeatherData)
      throw new Error("Не удалось получить данные за прошлые года");
    const predictedData = {
      date: historicWeatherData.date,
    };
    predictedData.temp = await ForecastNextYearWithRegression(historicWeatherData);

    const predictedAverageData =
      CalculateSumEffectiveTemp(predictedData, weatherData.sumEffectiveTemp, true);
    return {
      sumEffectiveTemp: predictedAverageData.sumEffectiveTemp,
      date: weatherData.date.concat(predictedAverageData.date),
      temp: weatherData.temp.concat(predictedAverageData.temp),
    }
  }
  catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function GetHistoricWeather(currentYear, forecastStartDate, forecastEndDate) {
  const
    startYearLeapFlag = IsLeapYear(currentYear),
    years = GenerateYearsList(currentYear),
    weatherDataMap = await FetchWeatherData(years, forecastStartDate, forecastEndDate);
  return ProcessWeatherData(weatherDataMap, startYearLeapFlag);
}

function IsLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function GenerateYearsList(currentYear) {
  const
    minYear = MIN_DATE.getFullYear(),
    years = [];
  while (currentYear > minYear) {
    currentYear--;
    years.push(currentYear);
  }
  return years;
}

async function FetchWeatherData(years, forecastStartDate, forecastEndDate) {
  const
    batchSize = 5,
    weatherDataMap = new Map();

  for (let i = 0; i < years.length; i += batchSize) {
    const batchYears = years.slice(i, i + batchSize);
    const batchPromises = batchYears.map(async year => {
      try {
        const data = await GetWeather({
          startDateMinus: year + forecastStartDate,
          endDateMinus: year + forecastEndDate
        });
        return ({ year, data });
      } catch {
        return null;
      }
    });

    const results = await Promise.all(batchPromises);
    results.forEach(result => {
      if (result && result.data) {
        weatherDataMap.set(result.year, result.data);
      }
    });
  }

  return weatherDataMap;
}

function ProcessWeatherData(weatherDataMap, startYearLeapFlag) {
  const historicWeatherData = {};
  let isDateWritten = false;

  for (const [year, weatherData] of weatherDataMap) {
    const isLeap = IsLeapYear(year);

    if (isLeap) {
      weatherData.temp.splice(-24);
      if (startYearLeapFlag && !isDateWritten) {
        weatherData.date.splice(-24);
        historicWeatherData.date = weatherData.date;
        isDateWritten = true;
      }
    } else if (!startYearLeapFlag && !isDateWritten) {
      historicWeatherData.date = weatherData.date;
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

function IsPreviousDays(date) {
  const
    today = new Date().withoutTime().getTime(),
    chosenDay = new Date(date).withoutTime().getTime();

  console.log('today', today)
  console.log('chosenDay', chosenDay)
  if (chosenDay < today)
    return true;

  return false
}

async function Prediction(weatherData, predictDate) {
  const endPredictDate = new Date(predictDate);
  endPredictDate.setDate((endPredictDate.getDate() + 1));
  const predictedData = await GetPredictedData(endPredictDate, weatherData);
  if (!predictedData) {
    throw new Error("Не удалось получить данные за прошлые года");
  }
  return predictedData;
}