import { CalculateByPeriod } from './weather.js';
import { CalculateByYear } from './forecast.js';
import { PrintGraph } from './graph.js';

export const
  baseTemp = parseFloat(document.getElementById('base-temp').value),
  chartObj = { chart: null };

export const byPeriod = document.getElementById('by-year');

Date.prototype.withoutTime = function () {
  let d = new Date(this);
  d.setHours(0, 0, 0, 0);
  return d; // Вернуть объект даты без информации о времени
};

export async function main() {
  const dateRangeData = GetDate(document.getElementById('start-date').value, document.getElementById('end-date').value);
  try {
    if (!byPeriod.checked) {
      let totalData = await CalculateByYear(dateRangeData);
      if (!totalData)
        throw new Error('Не удалось произвести расчёт, попробуйте позже или измените параметры')
      PrintResult(totalData);
      document.getElementById('loader').style.display = 'none';

    }
    else {
      let totalData = await CalculateByPeriod(dateRangeData);
      if (!totalData)
        throw new Error('Не удалось произвести расчёт, попробуйте позже или измените параметры')
      PrintResult(totalData)
      document.getElementById('loader').style.display = 'none';
    }
  } catch (error) {
    console.error('Ошибка:', error);
    document.getElementById('temperature-sum').textContent =
      'Ошибка. Не удалось рассчитать эффективную температуру. Попробуйте изменить параметры.';
    return null;
  }
}

// ? Вспомогательные Функции

function GetDate(startDate, endDate) {
  const data = {
    startDatePoint: startDate,
    startDateMinus: DateParseForAPI(startDate),
    endDatePoint: endDate,
    endDateMinus: DateParseForAPI(endDate),
  }
  const
    selectedYear = new Date(data.startDateMinus).getFullYear(),
    currentYear = new Date().getFullYear();
  if (!byPeriod.checked) {
    if (selectedYear === currentYear) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (new Date(data.startDatePoint).withoutTime().getTime() < new Date().withoutTime().getTime()) {
        data.endDateMinus = yesterday.toLocaleDateString('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        console.log('endDateMinus', data.endDateMinus)
      }
    }
    else {
      data.endDateMinus = `${selectedYear}-12-31`;
    }
  }
  return data;
}

// Изменение формата записи с ДД.ММ.ГГГГ до ГГГГ-ММ-ДД
function DateParseForAPI(date) {
  const [day, month, year] = date.split('.');
  return `${year}-${month}-${day}`;
}


// ! Вывод результата

function GetPluralValues(count, rules) {
  const result = new Intl.PluralRules('ru-RU').select(count);
  switch (result) {
    case 'one': {
      return `${count} ${rules[0]}`
    }
    case 'few': {
      return `${count} ${rules[1]}`
    }
    default: {
      return `${count} ${rules[2]}`
    }
  }
}

export function PrintResult(data) {
  PrintEffectiveTemp(data, OptimalHarvestingTiming(data));
  PrintGraph(data);
}

function PrintEffectiveTemp(totalData, optimalHarvestingTiming) {
  let introWord = 'Начиная с';
  if (!byPeriod.checked) {
    introWord = 'Со дня сева'
  }
  document.getElementById('output').style.display = 'block'
  document.getElementById('output__sum').innerHTML =
    `
    ${introWord} <u>${totalData.date[0]}</u> до <u> ${totalData.date.at(-1)}</u> за ${GetPluralValues(totalData.date.length, ["день", "дня", "дней"])} накопилось ${totalData.sumEffectiveTemp.toFixed(0)}°C эффективных температур.
    `;

  if (!optimalHarvestingTiming) {
    document.getElementById('output__optimal').innerHTML =
      `
      Оптимальные сроки уборки кукурузы на силос < b > не определены</b >
        `;
  } else {
    console.log('optimalHarvestingTiming', optimalHarvestingTiming)
    document.getElementById('output').style.display = 'block'
    document.getElementById('output__optimal').innerHTML =
      `
    Оптимальный срок уборки кукурузы на силос с <u> ${optimalHarvestingTiming.optimalStartDate}</u> до <u> ${optimalHarvestingTiming.optimalEndDate}</u>
        `;
  }
}

function OptimalHarvestingTiming(data) {
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
    return {
      optimalStartDate: data.date[xMinIndex],
      optimalEndDate: data.date[xMaxIndex]
    }
  }
  return null
}
