'use strict';

const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
const hands = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQo', 'A5s', 'KJo', 'T9s', '72o'];

let openRangeData = {};
let currentMode = 'open_none';
let currentQuestion = null;

const tableEl = document.getElementById('table');
const situationText = document.getElementById('situationText');
const handText = document.getElementById('handText');
const actionButtons = document.getElementById('actionButtons');
const resultText = document.getElementById('resultText');
const nextButton = document.getElementById('nextButton');
nextButton.textContent = 'NEXT';
const tabs = document.querySelectorAll('.tab-button');

function isBefore(p1, p2) {
  return positions.indexOf(p1) < positions.indexOf(p2);
}

function getValidPositions(before = null) {
  const idx = before ? positions.indexOf(before) : positions.indexOf('SB');
  return positions.slice(0, idx);
}

function generateRandomQuestion(mode) {
  const hand = hands[Math.floor(Math.random() * hands.length)];
  let hero, villain, openPos, threeBetPos;
  let question = {};

  if (mode === 'open_none') {
    hero = positions[Math.floor(Math.random() * positions.length)];
    const correctAction = openRangeData?.[hero]?.[hand] || 'Fold';

    question = {
      situation: `${hero}からOpen Raiseしますか？`,
      correct: correctAction,
      choices: ['Raise', 'Fold'],
      actionPosition: hero,
      stage: 'open_none'
    };
  }

  else if (mode === 'vs_open') {
    do {
      hero = positions[Math.floor(Math.random() * positions.length)];
    } while (hero === 'UTG');

    const validOpeners = getValidPositions(hero);
    villain = validOpeners[Math.floor(Math.random() * validOpeners.length)];

    question = {
      situation: `${villain}がOpen Raiseしました。\nあなた（${hero}）のアクションは？`,
      correct: '3Bet',
      choices: ['3Bet', 'Call', 'Fold'],
      openPosition: villain,
      actionPosition: hero,
      stage: 'vs_open'
    };
  }

  else if (mode === 'vs_3bet') {
    if (Math.random() < 0.5) {
      hero = 'UTG';
      const valid3Bettors = positions.filter(p => isBefore(hero, p) && p !== 'BB');
      threeBetPos = valid3Bettors[Math.floor(Math.random() * valid3Bettors.length)];

      question = {
        situation: `あなた（${hero}）のOpen Raiseに${threeBetPos}が3Betしました。\nあなた（${hero}）のアクションは？`,
        correct: '4Bet',
        choices: ['4Bet', 'Call', 'Fold'],
        openPosition: hero,
        threeBetPosition: threeBetPos,
        actionPosition: hero,
        stage: 'vs_3bet'
      };
    } else {
      openPos = 'UTG';
      const valid3Bettors = positions.filter(p => isBefore(openPos, p));
      threeBetPos = valid3Bettors[Math.floor(Math.random() * valid3Bettors.length)];
      const validHeroes = positions.filter(p => isBefore(threeBetPos, p));
      hero = validHeroes[Math.floor(Math.random() * validHeroes.length)];

      question = {
        situation: `${openPos}がOpen Raiseし、${threeBetPos}が3Betしました。\nあなた（${hero}）のアクションは？`,
        correct: '4Bet',
        choices: ['4Bet', 'Call', 'Fold'],
        openPosition: openPos,
        threeBetPosition: threeBetPos,
        actionPosition: hero,
        stage: 'vs_3bet'
      };
    }
  }

  else if (mode === 'bb_defense') {
    const validOpeners = getValidPositions('BB');
    villain = validOpeners[Math.floor(Math.random() * validOpeners.length)];

    question = {
      situation: `${villain}がOpen Raiseしました。\nあなた（BB）のアクションは？`,
      correct: 'Call',
      choices: ['3Bet', 'Call', 'Fold'],
      actionPosition: 'BB',
      openPosition: villain,
      stage: 'bb_defense'
    };
  }

  return { ...question, hand };
}

function clearPositions() {
  tableEl.innerHTML = '';
}

function createPositions(question) {
  clearPositions();
  const width = tableEl.clientWidth;
  const height = tableEl.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2 - 40;
  const radiusY = height / 2 - 30;
  const count = positions.length;
  const heroIndex = positions.indexOf(question.actionPosition);
  const rotate = (i) => (i - heroIndex + count / 2 + count) % count;

  for (let i = 0; i < count; i++) {
    const rotatedIndex = rotate(i);
    const angle = (2 * Math.PI * rotatedIndex) / count - Math.PI / 2;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);

    const posName = positions[i];
    const posEl = document.createElement('div');
    posEl.className = 'position';
    posEl.textContent = posName;
    posEl.style.left = `${x}px`;
    posEl.style.top = `${y}px`;
    posEl.style.transform = 'translate(-50%, -50%)';

    if (posName === question.actionPosition) {
      posEl.style.backgroundColor = '#00ffaa';
      posEl.style.color = '#004433';
      posEl.style.boxShadow = '0 0 20px #00ffaa';
      posEl.style.fontWeight = '900';
    } else if (posName === question.openPosition) {
      posEl.style.backgroundColor = '#ff5500';
      posEl.style.color = '#220000';
      posEl.style.boxShadow = '0 0 15px #ff5500';
      posEl.style.fontWeight = '700';
    } else if (question.threeBetPosition && posName === question.threeBetPosition) {
      posEl.style.backgroundColor = '#ffaa00';
      posEl.style.color = '#443300';
      posEl.style.boxShadow = '0 0 15px #ffaa00';
      posEl.style.fontWeight = '700';
    }

    tableEl.appendChild(posEl);
  }
}

function displayQuestion() {
  currentQuestion = generateRandomQuestion(currentMode);
  const q = currentQuestion;

  situationText.textContent = q.situation;
  handText.textContent = `ハンド: ${q.hand}`;
  resultText.textContent = '';
  actionButtons.innerHTML = '';

  createPositions(q);

  q.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice;
    if (/fold/i.test(choice)) {
      btn.classList.add('fold');
    } else if (/call/i.test(choice)) {
      btn.classList.add('call');
    } else {
      btn.classList.add('raise');
    }
    btn.addEventListener('click', () => {
      if (choice === q.correct) {
        resultText.style.color = '#0faa00';
        resultText.textContent = '正解！🎉';
      } else {
        resultText.style.color = '#ff2200';
        resultText.textContent = `不正解。正解は「${q.correct}」です。`;
      }
    });
    actionButtons.appendChild(btn);
  });
}

function switchMode(newMode) {
  currentMode = newMode;
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === newMode));
  displayQuestion();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (tab.dataset.mode !== currentMode) {
      switchMode(tab.dataset.mode);
    }
  });
});

nextButton.addEventListener('click', displayQuestion);

// 初期化：JSON読み込み後にスタート
window.addEventListener('load', () => {
  fetch('open_range.json')
    .then(res => res.json())
    .then(data => {
      openRangeData = data;
      switchMode(currentMode);
    })
    .catch(err => {
      console.error('open_range.jsonの読み込みに失敗しました:', err);
    });
});
