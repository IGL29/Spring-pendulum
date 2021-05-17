const inputElems = document.querySelectorAll('.input');
const resultCyclicFrequencyElem = document.querySelector('.result-cyclic-frequency');
const resultTimeElem = document.querySelector('.result-time');
const resultCoordinateXElem = document.querySelector('.current-coordinate-x');
const numberTotalOscillationsElem = document.querySelector('.number-total-oscillations');
const warningElem = document.querySelector('.warning');
const buttons = document.querySelectorAll('.form__button');
const buttonStart = document.querySelector('.button-play');
const buttonStop = document.querySelector('.button-stop');
const timeValueData = ['секунда', 'секунды', 'секунд'];
const BASE_COORDINATE_Y = 300;
let animateActive = false;
let startTime = null;
let timerId = null;
let timeValue = 0;
let recalculationRequired = false;
let requestID = null;

let params = {
  inputs: [
    {
      title: 'масса груза',
      name: 'cargoWeight',
      id: 1,
      minValue: 0.5,
      maxValue: 1,
      defaultValue: 0.5,
      step: 0.1,
    },
    {
      title: 'жесткость пружины',
      name: 'springStiffness',
      id: 2,
      minValue: 1,
      maxValue: 9,
      defaultValue: 5,
      step: 1,
    },
    {
      title: 'первоначальное отклонение от равновесия',
      name: 'initialX',
      id: 3,
      minValue: 0,
      maxValue: 20,
      defaultValue: 10,
      step: 2,
    },
  ],
};

let data = {
  inputValues: {},
}

let cyclicFrequency = null;
let currentСoordinateX = null;
let numberTotalOscillations = 0;

// Перебираем Инпуты, добавляем события и присваиваем дефолтное значение из объекта с параметрами.

function fillInputs() {
  for (input of inputElems) {
    input.addEventListener('input', calculateCharacteristics);
    input.value = params.inputs.find((item) => item.id === Number(input.dataset.id)).defaultValue;
  }
}

// Вычисляем формулу исходя из значений Инпутов и выводим результаты в область характеристик

function calculateCharacteristics(event) {

  //если изменили значение инпута запустить проверку значения и вернуть
  //"false/true" = требуется ли перерасчет формулы

  if (event) {
    recalculationRequired = checkingEnteredData(event.target);
  }
  //если перерасчет требуется
  if (recalculationRequired) {
    // очистка сообщений с предупреждениями о заполнении полей
    warnUser();

    let { cargoWeight, springStiffness, initialX } = data.inputValues;

    cyclicFrequency = Math.sqrt(springStiffness / cargoWeight);
    currentСoordinateX = initialX * Math.cos(cyclicFrequency * timeValue);

    resultCyclicFrequencyElem.innerText = cyclicFrequency.toFixed(2);

    // если анимация активна то выводим значения в область Характеристик
    if (animateActive) {
      resultTimeElem.innerText = `${timeValue} ${declOfNum(timeValue, timeValueData)}`;
      resultCoordinateXElem.innerText = `${convertValue(currentСoordinateX)} см`;
      numberTotalOscillationsElem.innerText = Math.floor(cyclicFrequency);
    }
    // после перерасчета сбрасываем "флаг", что перерасчет не требуется.
    recalculationRequired = false;
    draw();
  }
}

function convertValue(centimeters) {
  return (Number.isInteger(centimeters)) ? centimeters : currentСoordinateX.toFixed(2);
}

//склонение числительных
function declOfNum(number, titles) {
  cases = [2, 0, 1, 1, 1, 2];
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

//Проверяем инпуты при заполнении на превышение значения или ввода символов

function checkingEnteredData(input) {

  //записываем id инпута для его идентификации и ищем в объекте парметров params параметры для данного инпут,
  // для проверки допустимых значений сравнив с введенными пользователем

  let dataAttr = Number(input.dataset.id);
  let inputParams = params.inputs.find((item) => item.id === dataAttr);
  let inputValue = input.value.trim();

  //если значение инпута больше допустимого максимального, то присвоить допустимое максимальное значение.

  if (inputValue > inputParams.maxValue) {
    input.value = inputParams.maxValue;
    warnUser(inputParams, 'max');
    writingInputValue(input);
    //если меньше то предупредить о том что значение должно быть выше и не делать перерасчет

  } else if (inputValue < inputParams.minValue || inputValue === '') {
    warnUser(inputParams, 'min');

  } else {
    writingInputValue(input);
    return true;
  }
}

//записываем значение из инпут в объект значений

function writingInputValue(input) {
  let inputName = params.inputs.find((paramItem) => Number(input.dataset.id) === paramItem.id).name;
  data.inputValues[inputName] = Number(input.value);
}

//вывести предупреждение если некорректно заполнено поле (при вводе с клавиатуры)

function warnUser(paramInput, reason) {

  if (reason) {
    let message = null;
    let nameClass = null;

    if (reason === 'max' && !document.querySelector('.max')) {
      message = `Максимальное значение поля "${paramInput.title}" = "${paramInput.maxValue}"`;
      nameClass = 'max';
    } else if (reason === 'min' && !document.querySelector('.min')) {
      message = `Минимальное значение поля "${paramInput.title}" = "${paramInput.minValue}"`;
      nameClass = 'min';
    } else {
      return;
    }
    let p = document.createElement('p');
    p.classList.add('warn', nameClass);
    p.innerText = message;
    warningElem.append(p);
  }
  else if (document.querySelector('.warn')) {
    warningElem.innerHTML = '';
  }
}

// Перебираем родит.контейнеры инпутов и вешам обработчики кликов
const containerInput = document.querySelectorAll('.form__container');
containerInput.forEach((continer) => {
  continer.addEventListener('click', changingNumber)
})

// определяем какая кнопка была нажата
function changingNumber(ev) {
  ev.preventDefault();
  if (ev.target.tagName === 'BUTTON') {
    let input = this.querySelector('input');

    // и запускаем функцию указывая какое действие нужно совершить с числом (уменьшить/увеличить)
    if (ev.target.classList.contains('decrement')) {
      operationOnNumber(input, 'decrement');
    } else {
      operationOnNumber(input, 'increment');
    }
  }
}

// проверяем возможно ли уменьшить/увеличить значения основываясь на максимальном/минимальном допустимом
//значении и если да то увеличиваем на "шаг" заданный для каждого отдельного

function operationOnNumber(input, typeButton) {
  let param = params.inputs.find((item) => item.id === +input.dataset.id);
  let currentValue = input.value;
  let step = param.step;
  if (typeButton === 'increment' && (+currentValue + step <= param.maxValue)) {
    newValue = +currentValue + step;
    input.value = (Number.isInteger(newValue)) ? newValue : newValue.toFixed(1);
  } else if (typeButton === 'decrement' && (+currentValue - step >= param.minValue)) {
    newValue = +currentValue - step;
    input.value = (Number.isInteger(newValue)) ? newValue : newValue.toFixed(1);
  }
  data.inputValues[param.name] = Number(input.value);
  recalculationRequired = true;
  calculateCharacteristics();
}

//запускаем таймер/время и выполняем перерасчет

function countingTime() {
  timerId = setInterval(() => {
    timeValue++;
    recalculationRequired = true;
  }, 1000);
}

//обрабатываем нажатие на кнопку start скрывая кнопку и отображая кнопку stop
//запускаем счетчик

function start() {
  animateActive = true;
  recalculationRequired = true;
  buttonStop.classList.remove('hide');
  buttonStart.classList.add('hide');

  //если остались пустые поля или равные 0, проверяем с минимально допустимым значением
  // и если не соответсвует то заполняем

  for (input of inputElems) {
    input.disabled = true;
    if (input.value.trim() === '' || input.value.trim() === 0) {
      let minValue = params.inputs.find((item) => item.id === Number(input.dataset.id)).minValue;
      input.value = (input.value !== '' && minValue === +input.value) ? input.value : minValue;
    }
  }
  for (button of buttons) {
    button.disabled = true;
    button.classList.add('btn-unactive');
  }
  countingTime();
  startTime = new Date().getTime();
  requestID = requestAnimationFrame(animateChanges);
}

// при нажатии на stop скрываем кнопку, отображаем кнопку start сбрасываем значение времени
// и запускаем функцию перерасчета формулы

function stop() {
  //останавливаем анимацию
  cancelAnimationFrame(requestID);
  animateActive = false;
  //скрываем кнопку/отображаем start
  buttonStop.classList.add('hide');
  buttonStart.classList.remove('hide');
  //останавливаем таймер
  clearTimeout(timerId);
  for (input of inputElems) {
    input.disabled = false;
  }
  for (button of buttons) {
    button.disabled = false;
    button.classList.remove('btn-unactive');

  }
  //обнуляем таймер, запускаем перерасчет
  resetValues();
  draw();
  calculateCharacteristics();
}

//сбрасываем значения, очищаем область характеристик
function resetValues() {
  timeValue = 0;
  numberTotalOscillations = 0;
  recalculationRequired = true;
  resultTimeElem.innerText = '';
  resultCoordinateXElem.innerText = '';
  numberTotalOscillationsElem.innerText = '';
}

// отрисовываем canvas

function animateChanges() {
  requestID = requestAnimationFrame(animateChanges);

  calculateCharacteristics();

  let currentTime = new Date().getTime();
  // обновление следующей координаты для перемещения ( основываясь на миллисекундах )
  // координата умножается на 10 (как и при выборе отклонения вниз) для более явной визуальной разницы.
  step = ((data.inputValues.initialX * Math.cos(cyclicFrequency * ((currentTime - startTime) / 1000))) * 10);
  draw(step);
}

function draw(currentDeviation = 0) {

  let canvas = document.querySelector('#canvas');
  canvas.width = 300;
  canvas.height = 550;
  canvas.style.backgroundColor = '#FFF';
  let ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBase(ctx); // отрисовываем опору маятника
  let topPointWeight = drawWeight(canvas, ctx, currentDeviation); // отрисовываем маятник
  drawSpring(topPointWeight, canvas, ctx) // пружину
}

// отрисовываем опору маятника

function drawBase(ctx) {

  ctx.strokeStyle = "#000000";
  ctx.moveTo(100, 30);
  ctx.lineTo(200, 30);
  ctx.stroke();

  //рисуем циклом повторяющиеся линии над опорой маятника

  for (let i = 100; 220 > i; i += 20) {
    ctx.moveTo(i, 30);
    ctx.lineTo(i + 10, 15);
  }
  ctx.stroke();
}

// русуем пружину

function drawSpring(topPointWeight, canvas, ctx) {
  let centerX = canvas.width / 2;
  ctx.beginPath();

  ctx.moveTo(centerX, 30);
  ctx.lineTo(centerX, 40);
  ctx.lineTo(centerX + 10, 50);

  let x = 10;
  let y = null;
  let step = (topPointWeight - 72) / 47; // пропорционально уменьшаем высоту пружины
  for (y = 60; topPointWeight - 10 > y; y += step) {
    x = -x; // возвр X противоположный для отрисовки пружины по ширине
    ctx.lineTo(centerX + x, y);
  }
  ctx.lineTo(centerX, y);
  ctx.lineTo(centerX, topPointWeight);
  ctx.stroke();
}

//рисуем подвешенный грузик

function drawWeight(canvas, ctx, currentDeviation) {
  let size = data.inputValues.cargoWeight;
  // из-за малого значения radius = исходя из формулы,
  // для визуальной наглядности увеличиваю значение в 15 раз.
  let radius = Math.cbrt(size) * 15;
  ctx.beginPath();
  let centerX = canvas.offsetWidth / 2;
  let centerY = BASE_COORDINATE_Y + (currentDeviation || data.inputValues.initialX * 10);
  let startingAngle = 0;
  let endingAngle = 2 * Math.PI;
  ctx.arc(centerX, centerY, radius, startingAngle, endingAngle);
  ctx.stroke();

  // закрашиваем грузик внутри
  ctx.closePath();
  ctx.fillStyle = "#cc1313";
  ctx.fill();
  ctx.stroke();

  return centerY - radius;
}

function startApp() {
  draw();
  fillInputs(); // заполняем инпуты дефолными значениями
  recalculationRequired = true; // ставим "флаг" необходимости расчитать формулу
  calculateCharacteristics(); // запускаем расчет и выводим результаты
}

window.requestAnimationFrame = (function (callback) {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

buttonStart.addEventListener('click', start);
buttonStop.addEventListener('click', stop);

// Создаем свойства для хранения значений инпутов, исходя из их имени и количества, а также основываясь на имени инпута

for (input of params.inputs) {
  data.inputValues[input.name] = input.defaultValue;
}

// запускаем приложение
startApp();
