const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');

const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');

const baseTemp = document.getElementById('base-temp');

const farmName = document.getElementById('farm-name');
const clientName = document.getElementById('client-name');
const hybrid = document.getElementById('client-hybrid');
const phone = document.getElementById('phone');

export function ValidateForm(event) {
  if (!ValidateText(farmName, 'Введите название фирмы')) {
    return false
  }

  if (!ValidateText(clientName, 'Введите ваше имя')) {
    return false
  }
  if (!ValidateText(hybrid, 'Введите гибрид')) {
    return false
  }

  if (!ValidatePhone(phone)) {
    return false
  }

  if (!ValidateCoordinates(latitude, 90)) {
    return false
  }
  if (!ValidateCoordinates(longitude, 180)) {
    return false
  }

  if (!ValidateDates(startDate)) {
    return false
  }
  if (!ValidateDates(endDate)) {
    return false
  }

  if (!ValidateBaseTemp(baseTemp)) {
    return false
  }

  return true;
}


// Валидация Координат
function ValidateCoordinates(input, range) {
  input.setCustomValidity('');

  if (input.validity.typeMismatch) {
    ShowError(input, 'Введите число')
  }

  if (input.validity.valueMissing) {
    ShowError(input, 'Укажите на карте точку, либо введите вручную')
    return false;
  }

  if (input.validity.rangeOverflow || input.validity.rangeUnderflow) {
    ShowError(input, `Значение широты в пределах от -${range} до ${range}`)
    return false;
  }
  return true;
}

// Валидация Дат
function ValidateDates(input) {
  input.setCustomValidity('');

  if (input.validity.valueMissing) {
    ShowError(input, 'Введите дату в формате \"дд.мм.гггг\"')
    return false;
  }

  if (input.validity.patternMismatch) {
    ShowError(input, 'Введите дату в формате \"дд.мм.гггг\"')
    return false;
  }
  return true
}

// Валидация базовой температуры
function ValidateBaseTemp(input) {
  if (input.validity.valueMissing) {
    ShowError(input, 'Введите базовую температуру');
    return false
  }
  if (input.validity.typeMismatch) {
    ShowError(input, 'Введите число');
    return false
  }
  if (input.validity.rangeOverflow || input.validity.rangeUnderflow) {
    ShowError(input, 'Допустимые значения от 0°C до 20°C');
    return false
  }

  return true
}

function ValidateText(input, message) {
  if (input.validity.valueMissing) {
    console.log('ValidateText value')
    ShowError(input, message);
    return false
  }
  if (input.validity.typeMismatch) {
    console.log('ValidateText type')
    ShowError(input, message);
    return false
  }

  return true;
}

function ValidatePhone(input) {
  if (input.validity.valueMissing) {
    ShowError(input, 'Введите номер телефона в формате \"+79999999999\"')
    return false;
  }

  if (input.validity.typeMismatch) {
    ShowError(input, 'Введите номер телефона в формате \"+79999999999\"');
    return false
  }

  if (input.validity.patternMismatch) {
    ShowError(input, 'Введите номер телефона в формате \"+79999999999\"')
    return false;
  }

  return true
}

function ShowError(input, message) {
  input.setCustomValidity(message);
  input.reportValidity();  // Отображение кастомного сообщения
}
