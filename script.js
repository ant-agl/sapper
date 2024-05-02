class Cell {
  isOpen = false;
  isFlag = false;
  isDown = false;
  imgDefault = "img/cell.jpg";
  imgDown = "img/cellZero.jpg";
  imgOpened = "img/cellZero.jpg";
  imgFlag = "img/flag.png";

  constructor(element) {
    this.$cell = element;
    this.setBackground(this.imgDefault);
  }

  mouseDown() {
    if (!this.isOpen && !this.isDown) {
      this.setBackground(this.imgDown);
      this.isDown = true;
    }
  }

  mouseOut() {
    console.log(this.isDown, !this.isFlag, this.isOpen);
    if (this.isDown && !this.isFlag && !this.isOpen) {
      this.setBackground(this.imgDefault);
      this.isDown = false;
    }
  }

  contextmenu() {
    if (this.isOpen) return;

    this.isFlag = !this.isFlag;
    this.isDown = this.isFlag;
    if (this.isFlag) this.setBackground(this.imgFlag);
    else this.setBackground(this.imgDefault);
  }

  open() {
    if (this.isFlag || this.isOpen || !this.isDown) return false;

    this.isOpen = true;
    this.$cell.classList.add("open");
    this.setBackground(this.imgOpened);
    this.isDown = false;

    console.log(this.isDown, this.isOpen);

    return true;
  }

  disabled() {
    this.isOpen = true;
    this.$cell.classList.add("open");
  }

  setBackground(img) {
    this.$cell.style.backgroundImage = `url(${img})`;
  }
}

class EmptyCell extends Cell {}

class MinedCell extends Cell {
  constructor(element) {
    super(element);
    this.imgOpened = "img/bombClick.png";
  }
  showBomb() {
    if (!this.isFlag) this.setBackground("img/bomb.jpg");
  }
}

class NumberedCell extends Cell {
  constructor(element, countMines) {
    super(element);
    this.countMines = countMines;
    this.imgOpened = `img/cell${this.countMines}.png`;
  }
}

class Board {
  cells = [];
  timer = false;

  constructor(field, smile, time, bomb, width, height, countBombs, newGameBtn) {
    this.field = field;
    this.smile = smile;
    this.time = time;
    this.bomb = bomb;
    this.$width = width;
    this.$height = height;
    this.$countBombs = countBombs;
    this.newGameBtn = newGameBtn;

    this.update();
    this.newGameBtn.addEventListener("click", this.update.bind(this));
  }

  update() {
    this.cells = [];

    this.width = Number(this.$width.value);
    this.height = Number(this.$height.value);
    this.countBombs = Number(this.$countBombs.value);
    this.setBombValue();
    this.startTime();
    this.smile.style.backgroundImage = `url(img/smile.jpg)`;

    this.field.style.width = this.width * 32 + "px";

    this.generate();
  }

  generate() {
    this.generateCells();
    this.generateBomb();
    this.generateNumberedCell();

    this.field.innerHTML = "";
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.setAttribute("data-x", x);
        cell.setAttribute("data-y", y);
        this.field.appendChild(cell);

        if (this.cells[x][y] == -1) this.cells[x][y] = new MinedCell(cell);
        else if (this.cells[x][y] == 0) this.cells[x][y] = new EmptyCell(cell);
        else this.cells[x][y] = new NumberedCell(cell, this.cells[x][y]);

        cell.addEventListener("mousedown", () => {
          this.cells[x][y].mouseDown();
        });
        cell.addEventListener("mouseout", () => {
          this.cells[x][y].mouseOut();
        });
        cell.addEventListener("contextmenu", () => {
          this.cells[x][y].contextmenu();
          this.setBombValue();
        });
        cell.addEventListener("mouseup", () => {
          if (!this.cells[x][y].open()) return;

          if (this.cells[x][y] instanceof MinedCell) {
            for (let j = 0; j < this.height; j++) {
              for (let k = 0; k < this.width; k++) {
                if (y != j && x != k && this.cells[k][j] instanceof MinedCell) {
                  this.cells[k][j].showBomb();
                }
                if (
                  this.cells[k][j].isFlag &&
                  !(this.cells[k][j] instanceof MinedCell)
                ) {
                  this.cells[k][j].setBackground("img/bombX.png");
                }
                this.cells[k][j].disabled();
              }
            }

            clearInterval(this.timer);
            this.smile.style.backgroundImage = `url(img/smileX.jpg)`;
            return;
          }

          if (this.cells[x][y] instanceof EmptyCell) {
            for (let k = -1; k <= 1; k++) {
              for (let j = -1; j <= 1; j++) {
                // выходит за границу
                if (
                  x + k < 0 ||
                  y + j < 0 ||
                  x + k >= this.width ||
                  y + j >= this.height
                )
                  continue;

                this.cells[x + k][y + j].isDown = true;
                var evt = document.createEvent("MouseEvents");
                evt.initEvent("mouseup", true, true);
                this.cells[x + k][y + j].$cell.dispatchEvent(evt);
              }
            }
          }

          const countOpenedCells = this.getCountOpenedCells();
          const countWin = this.width * this.height - this.countBombs;
          // win
          if (countOpenedCells >= countWin) {
            clearInterval(this.timer);
            this.smile.style.backgroundImage = `url(img/smileWin.jpg)`;

            for (let j = 0; j < this.height; j++) {
              for (let k = 0; k < this.width; k++) {
                this.cells[k][j].disabled();
              }
            }
          }
        });
      }
    }
  }
  generateCells() {
    this.cells = [];
    for (let x = 0; x < this.width; x++) {
      this.cells[x] = [];
      for (let y = 0; y < this.height; y++) {
        this.cells[x][y] = 0;
      }
    }
  }
  generateBomb() {
    let bombs = 0;
    while (bombs < this.countBombs) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (this.cells[x][y] != -1) {
        this.cells[x][y] = -1;
        bombs++;
      }
    }
  }
  generateNumberedCell() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.cells[x][y] != -1) continue;

        for (let k = -1; k <= 1; k++) {
          for (let j = -1; j <= 1; j++) {
            // выходит за границу
            if (
              x + k < 0 ||
              y + j < 0 ||
              x + k >= this.width ||
              y + j >= this.height
            )
              continue;

            if (this.cells[x + k][y + j] != -1) this.cells[x + k][y + j]++;
          }
        }
      }
    }
  }
  getCountFlag() {
    if (this.cells.length == 0) return 0;

    let count = 0;
    for (let j = 0; j < this.height; j++) {
      for (let k = 0; k < this.width; k++) {
        if (this.cells[k][j].isFlag) count++;
      }
    }
    return count;
  }
  getCountOpenedCells() {
    if (this.cells.length == 0) return 0;

    let count = 0;
    for (let j = 0; j < this.height; j++) {
      for (let k = 0; k < this.width; k++) {
        if (this.cells[k][j].isOpen) count++;
      }
    }
    return count;
  }

  setBombValue() {
    let bombValue = this.countBombs - this.getCountFlag();
    if (bombValue < 0) bombValue = 0;
    if (bombValue < 10) bombValue = "00" + bombValue;
    else if (bombValue < 100) bombValue = "0" + bombValue;

    this.bomb.innerText = bombValue;
  }

  startTime() {
    if (this.timer) clearInterval(this.timer);

    this.timeValue = 0;
    this.time.innerText = "000";
    this.timer = setInterval(() => {
      this.timeValue++;
      if (this.timeValue < 10) {
        this.time.innerText = "00" + this.timeValue;
      } else if (this.timeValue < 100) {
        this.time.innerText = "0" + this.timeValue;
      } else if (this.timeValue < 1000) {
        this.time.innerText = this.timeValue;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }
}

const smile = document.getElementById("smile"),
  bomb = document.getElementById("bomb"),
  time = document.getElementById("time"),
  newGameBtn = document.getElementById("new-game"),
  field = document.getElementById("field"),
  width = document.getElementById("width"),
  height = document.getElementById("height"),
  countBombs = document.getElementById("bombValue");

const game = new Board(
  field,
  smile,
  time,
  bomb,
  width,
  height,
  countBombs,
  newGameBtn
);
