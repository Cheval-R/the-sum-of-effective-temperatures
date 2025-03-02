import Chart from 'chart.js/auto';
import { chartObj } from './main.js';

export function PrintGraph(data) {
  console.log('data', data)
  const newData = RemoveRepeatingGroups(data, 5);
  if (chartObj.chart) {
    chartObj.chart.destroy();
  }
  console.log('newData', newData)
  chartObj.chart = new Chart(document.getElementById('graph'), CreateChartConfig(newData));
}

function DeleteZeroFromStart(data) {
  let temp = data.temp.filter(item => item !== 0);
  let differenceDays = data.temp.length - temp.length;
  let date = data.date.slice(differenceDays);
  return { temp, date }
}

function RemoveRepeatingGroups(data, limit = 10) {
  let { temp, date } = DeleteZeroFromStart(data);
  const tempLengthAfterZero = temp.length;

  while (true) {
    let lastValue = temp[temp.length - 1];
    let count = 0;
    let i = temp.length - 1;

    while (i >= 0 && temp[i] === lastValue) {
      count++;
      i--;
    }

    if (count > limit) {
      temp = temp.filter(value => value !== lastValue);
    } else {
      break;
    }
  }

  let differenceDays = tempLengthAfterZero - temp.length;
  date = date.slice(0, date.length - differenceDays);

  return { temp, date };
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

        ctx.save();
        ctx.fillStyle = 'black';
        ctx.font = '22px Epilogue, "Proxima Nova", sans-serif';
        ctx.textAlign = 'center';
        ctx.translate((xMin + xMax) / 2, (yMin + yMax) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Оптимальные сроки уборки', 0, 0);
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
