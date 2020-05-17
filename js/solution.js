
  
'use strict';

// ~~~~~~~~~~~ Общий интерфейс DOM ~~~~~~~~~~~~~~
const wrapApp = document.querySelector('.wrap');
const menu = document.querySelector('.menu');
const currentImage = document.querySelector('.current-image');
const comments = document.querySelector('.comments__form');
const commentBody = document.querySelector('.comments__body');
const commentsForm = document.querySelector('.comments__form');
const tool = document.querySelector('.tool');
const error = document.querySelector('.error');
const errorMessage = document.querySelector('.error__message');
const imageLoader = document.querySelector('.image-loader');

// ~~~~~~~~~~~ Меню интерфейс DOM ~~~~~~~~~~~~~~
const dragMenu = document.querySelector('.drag');
const menuDrag = document.querySelector('.drag');
const menuBurger = document.querySelector('.burger');
const menuNew = document.querySelector('.new');
const menuComments = document.querySelector('.comments');
const menuDraw = document.querySelector('.draw');
const menuShare = document.querySelector('.share');
const menuCommentsTools = document.querySelector('.comments-tools');
const menuDrawTools = document.querySelector('.draw-tools');
const menuShareTools = document.querySelector('.share-tools');
// 1) переключатель комментариев (переместить в функцию)
let commentsFormCollection = wrapApp.querySelectorAll('.comments__form');
const commentsSpanToggle = document.querySelector('.menu__toggle-bg');
const commentsLableOff = document.querySelector('.menu__toggle-title_off');
const commentsLableOn = document.querySelector('.menu__toggle-title_on');
const commentsInputOff = document.getElementById('comments-off');
const commentsInputOn = document.getElementById('comments-on');
const inputMenuToggle = document.querySelector('.menu__toggle');



// 1) ~~~~~~~~~~~ Настройки приложения и данные ~~~~~~~~~~~~~~

const applicationState = {
	pictureOnCanvas: false,
	menuMode: null
}

let appState;
let appStateReview;

let app = {
	state: {
		publication: false,
		review: false,
		comments: false,
		draw: false,
		share: false,
	},
	setState: function(valueString) {
		if(typeof valueString === 'string') {
			if(valueString === 'publication') {
				app.state.publication = true;
				app.state.review = false;
				app.state.comments = false;
				app.state.draw = false;
				app.state.share = false;
			} else if(valueString === 'review') {
				app.state.publication = false;
				app.state.review = true;
				app.state.comments = false;
				app.state.draw = false;
				app.state.share = true;
			} else if(valueString === 'comments' && app.state.review === true) {
				app.state.comments = true;
				app.state.draw = false;
				app.state.share = false;
			} else if(valueString === 'draw' && app.state.review === true) {
				app.state.comments = false;
				app.state.draw = true;
				app.state.share = false;
			} else if(valueString === 'share' && app.state.review === true) {
				app.state.comments = false;
				app.state.draw = false;
				app.state.share = true;
			} else {
				console.log(new Error('Аргумент функции некорректен. Если приложение находится в режиме находится в режиме review, то доступны три его режима: comments, draw, share. Если приложение находится в режиме publication, то необходимо сначала перевести его в режим rewiew.'));
			}
		} else {
			console.log(new Error('В качестве аргумента должен быть указана строка'));
		}
	}
}

// Отправленные файлы на сервер пользователем
let serverFiles = [];



// 2) ~~~~~~~~~~~ Режимы приложения ~~~~~~~~~~~

// Приложение в режиме публикации
function appPublication() {
	// данные
	appState = 'publication';
	wrapApp.setAttribute('data-state', 'publication');
	// интерфейс
	currentImage.setAttribute('src', '');
	comments.style.display = 'none';
	document.querySelector('.drag').style.cursor = 'default';
	document.querySelector('.drag').style.position = 'relative';
	menuPublication();
	comments.remove();
	if(document.querySelector('input[type=file]') === null || document.querySelector('input[type=file]') === undefined) {
		hiddenInputFile();
	}
	userSelectionOfFile();
	userSelectsFileTransfer();
	// Сохраняем данные в localStorage
	localStorage.setItem('appState', 'appPublication');
	localStorage.setItem('menuMode', 'menuPublication');
	localStorage.wrapApp = document.querySelector('.wrap').outerHTML;
}

// Приложение в режиме рецензирования
function appReview() {
	// данные
	appState = 'review';
	wrapApp.setAttribute('data-state', 'review');
	// интерфейс
	// document.querySelector('input[type=file]').style.display = 'none';
	currentImage.setAttribute('src', localStorage.getItem('currentImageSrc'));
	currentImage.style.display = 'block';
	comments.style.display = 'block';
	comments.style.top = "500px";
	comments.style.left = "450px";
	menu.style.border = 'none';
	comments.remove();
	menuSharing();
	menuMove();
	drawBrowser();
	// Сохраняем данные в localStorage
	localStorage.setItem('appState', 'appReview');
	localStorage.canvas = document.querySelector('canvas').outerHTML;
}



// 3) ~~~~~~~~~~~ Выбор файла пользователем с устройства ~~~~~~~~~~~

// Выбор файла пользователем по кнопке
function userSelectionOfFile() {
	const fileInput = document.querySelector('.menu__item.mode.new');
	// файл выбран
	fileInput.addEventListener('change', onSelectFiles);

	function onSelectFiles(event) {
		console.log('Сработало событие change');
		if(event.target.files.length > 0) {
			console.log(event.target.files[0]);
			connectionWebSocket(event);
			// интерфейс
			menu.style.display = 'none';
			error.style.display = 'none';
			currentImage.style.display = 'none';
			imageLoader.style.display = 'inline-block';
			currentImage.setAttribute('src', 'Images-User/' + event.target.files[0].name);
			// действия
			sendFile(event.target.files[0]);
			setFileLink();
			// данные
			applicationState.pictureOnCanvas = true;
			// Сохранить ссылку на картинку в localStorage
			localStorage.setItem('currentImageSrc', currentImage.getAttribute('src'));
			function setFileLink() {
				// Ссылка на файл
				let link = URL.createObjectURL(event.target.files[0]);
				// Установка уникальной ссылки в виде blob 
				// currentImage.src = link;
				document.querySelector('.menu__url').value = link;
			}
		}
	}
}

// Выбор файла пользователем с помощью drag drop
function userSelectsFileTransfer() {
	wrapApp.addEventListener('drop', function(event) {
		event.preventDefault();
		let userFile = event.dataTransfer.files[0];
		if(userFile.type === 'image/jpeg' || userFile.type === 'image/png') {
			sendFile(userFile);
			error.style.display = 'none';
			menu.style.display = 'none';
			currentImage.setAttribute('src', 'Images-User/' + userFile.name);
			document.querySelector('input[type="file"]').style.display = 'none';
		} else {
			errorMessage.textContent = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
			error.style.display = 'block';
			menu.style.display = 'none';
		}
	});
	wrapApp.addEventListener('dragover', function(event) {
		event.preventDefault();
	});
}

// Скрытый input file
function hiddenInputFile() {
	// элемент
	const input = document.createElement('input');
	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'image/jpeg, image/png');
	// стили
	input.style.cssText= `
  	position: absolute;
  	display: block;
  	top: 0;
  	left: 0;
  	width: 100%;
  	height: 100%;
  	opacity: 0;
  	cursor: pointer;
  	z-index: 100;
	`;
	// вставка в html
	const fileInput = document.querySelector('.menu__item.mode.new');
	fileInput.prepend(input);
}



// 4) ~~~~~~~~~~~ Взаимодействие с сервером по HTTP ~~~~~~~~~~~

// Отправка файла на сервер
function sendFile(file) {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://neto-api.herokuapp.com/pic');
	let formData = new FormData();
	formData.append('title', file.name);
	formData.append('image', file);
	xhr.addEventListener('load', () => {
		console.log(`Файл ${file.name} сохранен на сервере.`);
		let response = JSON.parse(xhr.response);
		serverFiles.push(response);
		console.log(serverFiles);
		if (xhr.status === 200) {
			localStorage.setItem('menuMode', menuSharing);
			// Интерфес приложения
			applicationState.pictureOnCanvas = true;
			imageLoader.style.display = 'none';
			currentImage.style.display = 'block';
			menu.style.display = 'inline-block';
			document.querySelector('input[type="file"]').style.display = 'none';
			appReview();
		}
	});
	xhr.send(formData);
}

// Отправить комментарий к загруженному изображению по id
function sendComment(id, comment) {
	// Пользовательская ошибка
	if(typeof comment !== 'object') {
		throw new Error('comment должен быть типом object');
	}
	let body = 'message=' + comment.message + '&left=' + comment.left + '&top=' + comment.top;
	let xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://neto-api.herokuapp.com/pic/'+id+'/comments');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.addEventListener('load', () => {
		let response = JSON.parse(xhr.response);
		let comments = response.comments;
		console.log(comments);
		console.log(xhr);
	});
	xhr.send(body);
}

// Получить загруженную картинку с сервера по id
function requestImage(id) {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://neto-api.herokuapp.com/pic/' + id);
	xhr.addEventListener('load', () => {
		let response = JSON.parse(xhr.response);
		console.log(response);
	});
	xhr.send();
}

// requestImage('6d723f30-8f9e-11ea-bbc5-af808ac0ab74');
// sendComment('6d723f30-8f9e-11ea-bbc5-af808ac0ab74', {
// 	message: 'Текст комментария',
// 	left: 20,
// 	top: 20
// });


// ~~~~~~~~~~~~~~ Взаимодействие по веб-сокету ~~~~~~~~~~~~~~~


function connectionWebSocket(event) {
	let id = '508d4cf0-96c6-11ea-b5f6-5be89d225a0d';
	let socket = new WebSocket('wss://neto-api.herokuapp.com/pic/' + id);
	// Событие pic
	socket.onopen = function(e) {
		console.log('Соединение WebSocket установлено!');
		// 1) Отправить комментарий к текущему изображению (cобытие comment)
		let comment = {
			message: 'Комменатрий',
			left: 10,
			top: 10
		}
		// sendComment(id, comment);
		// 2) Получение информации об изображении
		requestImage(id);
		// 3) Отправка бинарных данных на сервер
		let image = event.target.files[0];
		let imageLink = URL.createObjectURL(image);
		let imageType = image.type;
		let imageBlob = new Blob([image], {type: imageType});
		socket.send(imageBlob);
		console.log('Бинарные данные изображения отправлены по веб-сокету.');
	}
	socket.onmessage = function(e) {
		console.log(JSON.parse(e.data));
	}
	socket.onerror = function(e) {
		console.log(e);
	}
	socket.onclose = function(e) {
		console.log(e);
	}
}

// connectionWebSocket();



// 4) ~~~~~~~~~~~~~ Плавающее меню ~~~~~~~~~~~~~

function menuMove() {
	let dragMenu = document.querySelector('.drag');
	console.log(appState);
	if(appState === 'publication') {
		cancelMenuMove();
	} else {
		document.querySelector('.drag').style.cursor = 'move';
		// Захват меню для перемещения
		console.log('Сделали меню перемещаемым');
		dragMenu.addEventListener('mousedown', onMouseDown);

		// menu.style.position = 'absolute';
	}

	function onMouseDown(e) {
		document.addEventListener('mouseup', onMouseUp);
		dragMenu.addEventListener('mousemove', moveTo);
		document.addEventListener('mousemove', moveTo);
		console.log('Сработало событие onMouseDown');
	}

	function onMouseUp(e) {
		console.log(e.target);
		document.removeEventListener('mouseup', onMouseUp);
		dragMenu.removeEventListener('mousemove', moveTo);
		document.removeEventListener('mousemove', moveTo);
		console.log('Сработало событие onMouseUp');
	}

	function moveTo(event) {
		const menuPosition = {
			x: event.pageX - 50  + 'px',
			y: event.pageY - 50 + 'px'
		}
		localStorage.setItem('menuPosition', JSON.stringify(menuPosition));
		menu.style.left = JSON.parse(localStorage.getItem('menuPosition')).x;
		menu.style.top = JSON.parse(localStorage.getItem('menuPosition')).y;

		// Границы перемещения
		let menuDomRect = menu.getBoundingClientRect();
		menu.style.whiteSpace = 'nowrap';
		if(menuDomRect.left <= 0 - 40) {
			menu.style.left = 0 - 40 + 'px';
		}
		if(menuDomRect.top <= 0) {
			menu.style.top = 0;
		}
		if(menuDomRect.right >= window.innerWidth) {
			menu.style.left = window.innerWidth - menuDomRect.width + 'px';
		}
		if(menuDomRect.bottom >= window.innerHeight) {
			menu.style.top = window.innerHeight - menuDomRect.height + 'px';
		}
	}

	// Отмена захвата меню для перемещения
	function cancelMenuMove() {
		document.querySelector('.drag').style.cursor = 'default';
		dragMenu.removeEventListener('mousedown', onMouseDown);
		document.removeEventListener('mouseup', onMouseUp);
		dragMenu.removeEventListener('mousemove', moveTo);
		document.removeEventListener('mousemove', moveTo);
		console.log('Отменили меню перемещение');
	}
}



// 5) ~~~~~~~~~~~~~ Режимы меню ~~~~~~~~~~~~~

// Выбор режима
function menuInitial() {
	// интерфейс меню
	for(let child of menu.children) {
		if(child.className === "menu__item drag" ||
			 									child.className === "menu__item mode new" || child.className === "menu__item mode comments" ||
			 									child.className === "menu__item mode draw" || child.className === "menu__item-title" ||
			 									child.className === "menu__item mode share") {
			child.style.display = "inline-block";
		} else {
			child.style.display = "none";
		}
	}
	// добавляем обработчики клика по пункту комментирование, рисование, поделиться
	menuComments.addEventListener('click', onClickMenuComments);
	menuDraw.addEventListener('click', onClickMenuDraw);
	menuShare.addEventListener('click', onClickMenuShare);
}

// Публикация
function menuPublication() {
	menu.style.border = 'none';
	menu.style.top = "300px";
	menu.style.left = "550px";
	// интерфейс меню
	for(let child of menu.children) {
		if(child.className === "menu__item drag"  || child.className === "menu__item mode new") {
			child.style.display = "inline-block";
		} else {
			child.style.display = "none";
		}
	}
}

// Комментирование
function menuСommenting() {
	// интерфейс меню
	for(let child of menu.children) {
		if(child.className === "menu__item drag" || child.className === "menu__item burger" || child.className === "menu__item mode comments" || child.className === "menu__item tool comments-tools") {
			child.style.display = "inline-block";
		} else {
			child.style.display = "none";
		}
	}
	// удаляем обработчик клика по пункту комментирование
	menuComments.removeEventListener('click', onClickMenuComments);
}

// Рисование
function menuDrawing() {
	// интерфейс меню
	for(let child of menu.children) {
		if(child.className === "menu__item drag" || child.className === "menu__item burger" || child.className === "menu__item mode draw" || child.className === "menu__item tool draw-tools") {
			child.style.display = "inline-block";
		} else {
			child.style.display = "none";
		}
	}
	// удаляем обработчик клика по пункту рисование
	menuDraw.removeEventListener('click', onClickMenuDraw);
}

// Поделиться
function menuSharing() {
	//позиционирование меню
	// menu.style.top = localStorage.getItem('menuPosition').y;
	menu.style.left = "50px";
	// интерфейс меню
	for(let child of menu.children) {
		if(child.className === "menu__item drag" || child.className === "menu__item burger" || child.className === "menu__item mode share" || child.className === "menu__item tool share-tools") {
			child.style.display = "inline-block";
		} else {
			child.style.display = "none";
		}
	}
	// удаляем обработчик клика по пункту поделится
	menuShare.removeEventListener('click', onClickMenuShare);
}



// 6) ~~~~~~~~~~~~~ Обработчики пунктов меню ~~~~~~~~~~~~~

// Обработчики кликов по пунктам меню
function onClickMenuNew() {
	appPublication();
	menuMove();
	// Удаляем все формы комментариев
	let comments = wrapApp.querySelectorAll('.comments__form');
	for(let comment of comments) {
		comment.remove();
	}
}

function onClickMenuComments() {
	appStateReview = 'comments';
	localStorage.setItem('menuMode', menuСommenting);
	menuСommenting();
	activateModeComment();
}

function onClickMenuDraw() {
	appStateReview = 'draw';
	localStorage.setItem('menuMode', menuDrawing);
	menuDrawing();
	drawOnCanvas();
}

function onClickMenuShare() {
	appStateReview = 'share';
	localStorage.setItem('menuMode', menuSharing);
	menuSharing();
}

function onClickNew(e) {
	appState = 'publication';
	appStateReview = null;
	applicationState.pictureOnCanvas = false;
	document.querySelector('input[type="file"]').style.display = 'block';
	canvas.style.display = 'none';
}

function clickBurger() {

	if(appStateReview === 'draw') {
		stopDrawing();
	}
	if(appStateReview === 'comments') {
		stopModeComment();
	}

	// данные
	appStateReview = 'initial';
	localStorage.setItem('menuMode', 'menuInitial');
	// действия
	menuInitial();
	// скрываем  бургер
	menuBurger.style.display = 'none';
	// Вешаем обработчики клика на пункты меню в режиме initial при клике на бургер!
	menuNew.addEventListener('click', onClickMenuNew);
	menuComments.addEventListener('click', onClickMenuComments);
	menuDraw.addEventListener('click', onClickMenuDraw);
	menuShare.addEventListener('click', onClickMenuShare);
	menuNew.addEventListener('click', onClickNew);
}



// 7) ~~~~~~~~~~~~~ Рисовать на изображении ~~~~~~~~~~~~~

// Для функции рисования
let canvas;
let ctx;

let color = {
	red: '#ea5d56',
	yellow: '#f3d135',
	green: '#6cbe47',
	blue: '#53a7f5',
	purple: '#b36ade'
}

let colorValue = color.green
let isMouseDown = false;
let penThickness = 4;

// Интерфейс html выбора цвета
const inputRed = document.querySelector('.menu__color.red');
const inputYellow = document.querySelector('.menu__color.yellow');
const inputGreen = document.querySelector('.menu__color.green');
const inputBlue = document.querySelector('.menu__color.blue');
const inputPurple = document.querySelector('.menu__color.purple');

// Вешаем обработчик клика на интерфейс выбора цвета
inputRed.addEventListener('click', onClickInputColor);
inputYellow.addEventListener('click', onClickInputColor);
inputGreen.addEventListener('click', onClickInputColor);
inputBlue.addEventListener('click', onClickInputColor);
inputPurple.addEventListener('click', onClickInputColor);

// Отмена переноса картинки (браузерное по-умолчанию)
currentImage.addEventListener('dragstart', function(e) {
	e.preventDefault();
});

function drawBrowser() {
	createCanvas();
	userСolorManagement();
}

function drawOnCanvas() {
	// Вешаем обработчики
	canvas.addEventListener('mousedown', onMouseDownCanvas);
	canvas.addEventListener('mouseup', onMouseUpCanvas);
	canvas.addEventListener('mousemove', onMouseMoveCanvas);
}

function userСolorManagement() {
	let canvas = document.querySelector('canvas');
	let ctx = canvas.getContext("2d");
	// Устанавливаемы цвет выбранный по-умолчанию (checked)
	for(let item of document.querySelectorAll('.menu__color')) {
		if(item.hasAttribute('checked')) {
			let arrayClassname = item.className.split(' ');
			let lastClassname = arrayClassname[arrayClassname.length - 1];
			let colorValue = color[lastClassname];
			ctx.strokeStyle = colorValue;
			ctx.fillStyle = colorValue;
		}
	}
}

function stopDrawing() {
	let canvas = document.querySelector('canvas');
	canvas.removeEventListener('mousedown', onMouseDownCanvas);
	canvas.removeEventListener('mouseup', onMouseUpCanvas);
	canvas.removeEventListener('mousemove', onMouseMoveCanvas);
	canvas.style.display = 'none';
	isMouseDown = false;
}

function stopDrawing() {
	canvas.removeEventListener('click', onMouseDownCanvas);
	canvas.removeEventListener('mouseup', onMouseUpCanvas);
	canvas.removeEventListener('mousemove', onMouseMoveCanvas);
	isMouseDown = false;
}

function createCanvas() {
	if(canvas === undefined) {
		let canvasTag = '<canvas></canvas>';
		document.body.insertAdjacentHTML('afterbegin', canvasTag);
		canvas = document.querySelector('canvas');
		ctx = canvas.getContext("2d");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.zIndex = 1;
		canvas.style.position = 'absolute';
	} else {
		// очистить весь холст
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		canvas.style.display = 'block';
	}
}

function onClickInputColor(e) {
	e.stopPropagation();
	for(let item of document.querySelectorAll('.menu__color')) {
		item.removeAttribute('checked');
	}
	e.target.setAttribute('checked', 'checked');
	let arrayClassname = e.currentTarget.className.split(' ');
	let lastClassname = arrayClassname[arrayClassname.length - 1];
	// вырезать слово из имени класса с конца установить в качестве значения цвета
	let colorValue = color[lastClassname];
	ctx.strokeStyle = colorValue;
	ctx.fillStyle = colorValue;
}

// Обрабочики мыши для рисования
function onMouseDownCanvas() {
	isMouseDown = true;
}

function onMouseUpCanvas() {
	isMouseDown = false;
	ctx.beginPath();
	localStorage.canvas = document.querySelector('canvas').outerHTML;
}

function onMouseMoveCanvas(e) {
	if(isMouseDown) {
		// линия
		ctx.lineWidth = penThickness * 2;
		ctx.lineTo(e.clientX, e.clientY);
		// ctx.strokeStyle = colorValue;
		ctx.stroke();

		// круг
		ctx.beginPath();
		ctx.arc(e.clientX, e.clientY, penThickness, 0, Math.PI * 2);
		// ctx.fillStyle = colorValue;
		ctx.fill();

		// линия
		ctx.beginPath();
		ctx.moveTo(e.clientX, e.clientY);
	}
}



// 8) ~~~~~~~~~~~~~ Режим комментирование ~~~~~~~~~~~~~


	
  const comment = `<div class="comment">
   		<p class="comment__time"></p>
   		<p class="comment__message"></p>
   	</div>`

	// Режим комментирования активирован
	function activateModeComment() {
		console.log('Режим комментирования активирован');
		appStateReview = 'comments';
		let canvas = document.querySelector('canvas');
		for(let commentsForm of wrapApp.querySelectorAll('.comments__form')) {
			commentsForm.addEventListener('click', function(e) {
				e.stopPropagation();
			});
		}
		canvas.addEventListener('click', createNewComment);
		// включить отправку сообщений
		let commentsFormAll = wrapApp.querySelectorAll('.comments__form')
		for(let commentsForm of commentsFormAll) {
			let commentsBody = commentsForm.querySelector('.comments__body');
			let commentsInput = commentsBody.querySelector('.comments__input');
			let commentsSubmit = commentsBody.querySelector('.comments__submit');
			commentsInput.style.display = 'inline-block';
			commentsSubmit.style.display = 'inline-block';
		}
	}

	// Режим комментирования отключен
	function stopModeComment() {
		console.log('Режим комментирования отключен');
		canvas.removeEventListener('click', createNewComment);
		// прерываем создание нового комментария
		let commentFormAll = wrapApp.querySelectorAll('.comments__form');
		if(commentFormAll.length === 0) {
			return;
		} else {
			let commentFormLast = commentFormAll[commentFormAll.length -1 ];
			if(commentFormLast.querySelector('.comments__body').children.length === 3) {
				commentFormLast.remove();
			}
		}

	}

	// Создать новый комментарий
	function createNewComment(e) {
		console.log('Создать новый комментарий');

		// Шаблон нового комментария
		const commentNew = `<form class="comments__form">
        <span class="comments__marker"></span><input type="checkbox" class="comments__marker-checkbox">
        <div class="comments__body" style="display:block; position: relative; z-index:99999999">
          <textarea class="comments__input" type="text" placeholder="Напишите ответ..."></textarea>
          <input class="comments__close" type="button" value="Закрыть">
          <input class="comments__submit" type="submit" value="Отправить">
       	</div>
      </form>`;

    const commentLoader = `<div class="comment">
      <div class="loader">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>            
    </div>`;

		let commentsForm = document.querySelectorAll('.comments__form');
		if(commentsForm.length >= 1) {
			for(let form of commentsForm) {
				let body = form.querySelector('.comments__body');
				let comment = body.querySelector('.comment');
				if(comment === null) {
					form.remove();
				}
				body.style.display = 'none';	
			}
		}
		// z-index
		for(let formComment of commentsForm) {
			console.log(formComment.style.zIndex);
			formComment.style.zIndex = 9999;
		}

		// вставка нового комментария в html
		wrapApp.insertAdjacentHTML('beforeend', commentNew);

		// Интерфейс нового комментария
		let commentForm = wrapApp.lastChild;
		let commentMarker = commentForm.querySelector('.comments__marker');
		let commentBody = commentForm.querySelector('.comments__body');
		let commentsInput = commentBody.querySelector('.comments__input');
		let commentsClose = commentBody.querySelector('.comments__close');
		let commentsSubmit = commentBody.querySelector('.comments__submit');
		commentMarker.style.zIndex = 9999999999;

		coordinatesNewComment();
		commentsBodyOutViewport();
		clickMarker();
		clickClose();
		clickSend();

		// Координаты нового комментария
		function coordinatesNewComment() {
			wrapApp.lastChild.addEventListener('click', function(e) {
				e.stopPropagation(commentsForm);
			});
			wrapApp.lastChild.style.left = e.pageX - 25 + 'px';
			wrapApp.lastChild.style.top = e.pageY + 5 +'px';
		}
		// Выход тела формы за переделы окна просмотра браузера
		function commentsBodyOutViewport() {
			let commentsFormAll = wrapApp.querySelectorAll('.comments__form');
			let commentFormLast = commentsFormAll[commentsFormAll.length - 1];
			let commentBodyLast = commentFormLast.querySelector('.comments__body');
			let commentFormLastDomRect = commentFormLast.getBoundingClientRect();
			let commentBodyLastDomRect = commentBodyLast.getBoundingClientRect();

			console.log(commentBodyLast);
			console.log(commentBodyLastDomRect);

			// определяем выход за границы окна просмотра браузера
			if(commentFormLastDomRect.right >= window.innerWidth) {
				console.log('Выход за пределы right');	
				document.body.style.overflow = 'scroll';
				window.scrollTo( 1000, 1000 );
			}
			if(commentFormLastDomRect.bottom >= window.innerHeight) {
				console.log('Выход за пределы bottom');
				document.body.style.overflow = 'scroll';
				window.scrollTo( 1000, 1000 );
			}
		}
		// Клик по маркеру
		function clickMarker() {
			commentMarker.addEventListener('click', function(e) {
				let commentsForm = document.querySelectorAll('.comments__form');
				let lastForm = commentsForm[commentsForm.length - 1];
				let body = lastForm.querySelector('.comments__body');
				let comment = body.querySelector('.comment');
				if(comment === null) {
					lastForm.remove();
				}
				if(commentsForm.length >= 1) {
					for(let form of commentsForm) {
						let body = form.querySelector('.comments__body');
						body.style.display = 'none';
					}
				}
				if(commentBody.style.display === 'none') {
					commentBody.style.display = 'block';
				} else if(commentBody.style.display === 'block' && commentBody.querySelectorAll('.comment').length !== 0) {
					commentBody.style.display = 'none';
				}
				// при клике по маркеру изменяем overflow тоже
				let markerBody = e.target.parentNode.querySelector('.comments__body');
				let targetDomRect = markerBody.getBoundingClientRect();
				// определяем выход за границы окна просмотра браузера
				if(targetDomRect.right >= window.innerWidth) {
					console.log('Выход за пределы right');	
					document.body.style.overflow = 'scroll';
					window.scrollTo( 1000, 1000 );
				}
				if(targetDomRect.bottom >= window.innerHeight) {
					console.log('Выход за пределы bottom');
					document.body.style.overflow = 'scroll';
					window.scrollTo( 1000, 1000 );
				}
			});
		}
		// Клик по закрыть комментарии
		function clickClose() {
			commentsClose.addEventListener('click', function(e) {
				commentsInput.value = '';
				e.stopPropagation();
				if(commentBody.querySelectorAll('.comment').length === 0) {
					commentForm.style.display = 'none';
					commentForm.remove();
				} else {
					commentBody.style.display = 'none';
				}
				// Убираем скролл если были
				document.body.style.overflow = 'hidden';
			});
		}
		// Клик по отправить комментарий
		function clickSend(e) {
			commentsSubmit.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if(commentsInput.value !== '') {
					// Если первый комментарий
					if(commentBody.querySelectorAll('.comment').length === 0) {
						// Обновляни коллекцию комментариев в интерфейсе
						commentsFormCollection = wrapApp.querySelectorAll('.comments__form');
						// Если комментарии отключены, не показываем новый комментарий
						if(commentsInputOff.hasAttribute('checked')) {
							console.log(commentsInputOff.hasAttribute('checked'));
							let currnetForm = commentsFormCollection[commentsFormCollection.length - 1];
							console.log(currnetForm);
							currnetForm.style.display = 'none';
						}
						commentBody.style.display = 'none';
					}
					// Создаем новый комментарий в body form-comment
					commentBody.insertAdjacentHTML('afterbegin', comment);
					commentBody.querySelector('.comment').querySelector('.comment__time').textContent = new Date().toLocaleString();
					commentBody.querySelector('.comment').querySelector('.comment__message').textContent = commentsInput.value;
					// Взаимодействие с сервером
					let commentSend = {
						message: commentsInput.value,
						left: parseInt(wrapApp.lastChild.style.left),	
						top: parseInt(wrapApp.lastChild.style.top)
					}
					sendComment('6d723f30-8f9e-11ea-bbc5-af808ac0ab74', commentSend);
					// Очищаем input text после добавления комментария и отправки на сервер
					commentsInput.value = '';
					hiddenScroll(e);
				}
			});
			function indicatorLoading(e) {
				// добавляем прелоадер
				e.target.parentNode.querySelector('.comments__input').insertAdjacentHTML('beforebegin',commentLoader);
			}
			function hiddenScroll(e) {
				// убираем скроллыесли боди не выходит за пределы viewport
				let markerBody = e.target.parentNode;
				let targetDomRect = markerBody.getBoundingClientRect();
				// определяем выход за границы окна просмотра браузера
				if(targetDomRect.right < window.innerWidth) {
					document.body.style.overflow = 'hidden';
					window.scrollTo(0, 0);
				}
				if(targetDomRect.bottom < window.innerHeight) {
					document.body.style.overflow = 'hidden';
					window.scrollTo( 0, 0 );
				}
				if(targetDomRect.right >= window.innerWidth || markerBody.style.display === 'block') {
					document.body.style.overflow = 'scroll';
					window.scrollTo(1000, 1000);
				}
				if(targetDomRect.bottom >= window.innerHeight || markerBody.style.display === 'block') {
					document.body.style.overflow = 'scroll';
					window.scrollTo( 1000, 1000 );
				}
			}
		}
	}

	// Переключатель комментариев span
	(function commentsToggle() {
		commentsSpanToggle.addEventListener('click', function(event) {
			console.log('Клик переключатель комментариев!');
			// отмена всплытия
			event.stopPropagation();
			// комментарии включены
			if(commentsInputOff.hasAttribute('checked')) {
				commentsInputOff.removeAttribute('checked');
				commentsInputOn.setAttribute('checked', 'checked');
				// показать комментарии
				for(let commentsForm of commentsFormCollection) {
					commentsForm.style.display = 'block';
				}
				console.log(commentsFormCollection);
			} // комментарии выключены
			else if(commentsInputOn.hasAttribute('checked')) {
				commentsInputOn.removeAttribute('checked');
				commentsInputOff.setAttribute('checked', 'checked');
				// скрыть комментарии
				for(let commentsForm of commentsFormCollection) {
					commentsForm.style.display = 'none';
				}
			}
		});
		commentsLableOn.addEventListener('click', function() {
			if(commentsInputOff.hasAttribute('checked')) {
				commentsInputOff.removeAttribute('checked');
				commentsInputOn.setAttribute('checked', 'checked');
				// показать комментарии
				for(let commentsForm of commentsFormCollection) {
					commentsForm.style.display = 'block';
				}
			}
		});
		commentsLableOff.addEventListener('click', function() {
			if(commentsInputOn.hasAttribute('checked')) {
				commentsInputOn.removeAttribute('checked');
				// скрыть комментарии
				commentsInputOff.setAttribute('checked', 'checked');
				for(let commentsForm of commentsFormCollection) {
					commentsForm.style.display = 'none';
				}
			}
		});
	})();



// Доделать

// Поменять поочередность сверху вниз сообщений, не получаестя
// Прелоадер (при отправке комментария на сервер)
// z-index




// 9) ~~~~~~~~~~~~~ Режим поделиться ~~~~~~~~~~~~~

// Копировать url по кнопке копировать в буфер обмена
const buttonCopy = document.querySelector('.menu_copy');
	buttonCopy.addEventListener('click', function() {
		let copyText = document.querySelector('.menu__url');
		copyText.select();
		document.execCommand("copy");
	});



// 10) ~~~~~~~~~~~~~ Работа с LocalStorage ~~~~~~~~~~~~~

// // 0) Режим публикации
// 	if(localStorage.getItem('appState') !== appReview.toString()) {
// 		appPublication();
// 	} else {
// 		// 1) Вызываем текущее состояние приложения
// 		let appState = eval('(' + localStorage.getItem('appState') + ')');
// 		appState();
// 		// 2) Вызываем текущий режим меню
// 		let menuMode = eval('(' + localStorage.getItem('menuMode') + ')');
// 		menuMode();
// 		// скрываем  бургер
// 		// menuBurger.style.display = 'none';
// 		// Вешаем обработчики клика на пункты меню в режиме initial при клике на бургер!
// 		menuNew.addEventListener('click', onClickMenuNew);
// 		menuComments.addEventListener('click', onClickMenuComments);
// 		menuDraw.addEventListener('click', onClickMenuDraw);
// 		menuShare.addEventListener('click', onClickMenuShare);
// 		menuNew.addEventListener('click', onClickNew);
// 		// 3) Расположение меню из localStorage
// 		menu.style.top = JSON.parse(localStorage.getItem('menuPosition')).y;
// 		menu.style.left = JSON.parse(localStorage.getItem('menuPosition')).x;
// 	}



// 9) ~~~~~~~~~~~~~~~~~~~~~~  Выполнить программу ~~~~~~~~~~~~~~~~~~~~~~

// document.addEventListener("DOMContentLoaded", function() {
// 	appPublication();
// 	userSelectionOfFile();
// 	menuBurger.addEventListener('click', clickBurger);
// });




// ~~~~~~~~~~~~~~~~~~~~~~  Выполнить программу ~~~~~~~~~~~~~~~~~~~~~~

// ------- С сохранением состояния приложения при обновлении страницы ------------

document.addEventListener("DOMContentLoaded", function() {
	// Сохранение состояния приложения при обновлении страницы
	if (sessionStorage.getItem("is_reloaded")) {
		console.log('Страница перезагружена');
		if(localStorage.appState === 'appPublication') {
			appPublication();
			userSelectionOfFile();
			userSelectsFileTransfer();
			menuBurger.addEventListener('click', clickBurger);
		} else if(localStorage.appState === 'appReview') {
			userSelectionOfFile();
			userSelectsFileTransfer();
			menuBurger.addEventListener('click', clickBurger);
			appReview();
			// Позиция меню
			menu.style.left = JSON.parse(localStorage.menuPosition).x;
			menu.style.top = JSON.parse(localStorage.menuPosition).y;
			// Режим меню
			// let menuModeFun = new Function(localStorage.menuMode);
			// menuModeFun();
			// let menuModeFun = eval('(' + localStorage.menuMode + ')');
			// menuModeFun();
			menuInitial();
			// Сохраненные рисунки на canvas
			document.body.insertAdjacentHTML('afterbegin', localStorage.canvas);
		}
	} else {
		appPublication();
		menuBurger.addEventListener('click', clickBurger);
		sessionStorage.setItem("is_reloaded", true);
	}
});



// Что осталось сделать

// 1) Отменить перемещение меню в режиме публикация.
// 2) Отменить всплытие (двойной клик на lable) переключателе 
// 3) Баг с переключателем span

// 4) Взаимодействие с сервером
// 5) Сохранение состояния приложения (последних изменений) в localStorage
