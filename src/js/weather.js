import { baseTemp } from './main.js';


export async function CalculateByPeriod(data) {
  try {
    const weatherData = await GetWeather(data);
    if (!weatherData) {
      throw new Error('Не удалось получить погодные данные. Попробуйте позже или измените параметры');
    }
    return CalculateSumEffectiveTemp(weatherData);
  }
  catch {
    console.error('Ошибка:', error);
    document.getElementById('temperature-sum').textContent =
      'Ошибка. Не удалось рассчитать эффективную температуру. Попробуйте изменить параметры.';
    return null;
  }
}

export async function GetWeather(DATAdate) {
  const
    latitude = document.getElementById('latitude').value,
    longitude = document.getElementById('longitude').value;
  // API URL
  const url = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${DATAdate.startDateMinus}&end_date=${DATAdate.endDateMinus}&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=Europe%2FMoscow`;

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
    return null;
  }
}

// ! Вспомогательные
export function CalculateSumEffectiveTemp(data, sumEffectiveTemp = 0, forecastFlag = false) {
  const date = [], temp = [];
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
  return { sumEffectiveTemp, temp, date };
}

function GetAverageTempByDay(index, data) {
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