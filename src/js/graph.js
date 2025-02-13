import Chart from 'chart.js/auto';
import { chartObj } from './main.js';

export function PrintGraph(data) {
  RemoveRepeatingGroups(data, 5)
  if (chartObj.chart) {
    chartObj.chart.destroy();
  }
  chartObj.chart = new Chart(document.getElementById('graph'), CreateChartConfig(data));
}

function RemoveRepeatingGroups(data, limit = 10) {
  let initialLength = data.temp.length;
  data.temp = data.temp.filter(item => item !== 0);
  let differenceDays = initialLength - data.temp.length;
  data.date = data.date.slice(differenceDays);
  initialLength = data.temp.length;
  while (true) {
    let lastValue = data.temp[data.temp.length - 1];
    let count = 0;
    let i = data.temp.length - 1;

    // Подсчет количества повторений последнего элемента
    while (i >= 0 && data.temp[i] === lastValue) {
      count++;
      i--;
    }

    // Если повторений больше limit, удаляем ВСЕ вхождения этого элемента
    if (count > limit) {
      data.temp = data.temp.filter(value => value !== lastValue);
    } else {
      break;
    }
  }
  differenceDays = initialLength - data.temp.length;
  data.date = data.date.slice(0, data.date.length - differenceDays);
}

function CreateBoxPlugin() {
  return {
    id: 'boxPlugin',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const xAxis = chart.scales['x'];
      const yAxis = chart.scales['y'];
      const dataset = chart.data.datasets[0].data;

      const yMinValue = yAxis.min;
      const yMaxValue = yAxis.max;

      let xMinIndex = null;
      let xMaxIndex = null;

      dataset.forEach((value, index) => {
        if (value >= 850 && value <= 950) {
          if (xMinIndex === null) xMinIndex = index;
          xMaxIndex = index;
        }
      });

      if (xMinIndex !== null && xMaxIndex !== null) {
        const xMin = xAxis.getPixelForValue(chart.data.labels[xMinIndex]);
        const xMax = xAxis.getPixelForValue(chart.data.labels[xMaxIndex]);
        const yMin = yAxis.getPixelForValue(yMaxValue);
        const yMax = yAxis.getPixelForValue(yMinValue);

        ctx.fillStyle = 'rgba(134, 250, 111, 0.48)';
        ctx.fillRect(xMin, yMax, xMax - xMin, yMin - yMax);
        ctx.strokeStyle = 'rgb(134, 250, 111)';
        ctx.lineWidth = 2;
        ctx.strokeRect(xMin, yMax, xMax - xMin, yMin - yMax);

        // Добавляем подпись внутри выделенной области
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.font = '22px Epilogue, "Proxima Nova", sans-serif';
        ctx.textAlign = 'center';
        ctx.translate((xMin + xMax) / 2, (yMin + yMax) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Оптимальные сроки уборки', 0, 0);
        ctx.restore();
      }
    }
  };
}

function CreateChartConfig(data) {
  return {
    type: 'line',
    data: {
      labels: data.date,
      datasets: [
        {
          label: 'Сумма эффективных температур',
          data: data.temp,
          borderColor: 'orange',
          backgroundColor: 'orange',
          fill: false,
          pointBackgroundColor: 'orange',
          pointRadius: 3
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            font: {
              size: 20,
              weight: 600,
            }
          }
        }
      }
    },
    plugins: [CreateBoxPlugin()]
  };
}

