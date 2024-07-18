//ส่วนการตั้งค่าตัวแปร
const ANSWER_LENGTH = 5; // ความยาวของคำตอบ (5 ตัวอักษร)
const ROUNDS = 6; // จำนวนรอบที่ผู้เล่นสามารถทายได้
const letters = document.querySelectorAll(".scoreboard-letter"); // เลือกทุกองค์ประกอบที่มีคลาส "scoreboard-letter"
const loadingDiv = document.querySelector(".info-bar"); // เลือกองค์ประกอบที่มีคลาส "info-bar"

//ส่วนการตั้งค่าเริ่มต้น
async function init() {
  let currentRow = 0; // แถวปัจจุบันของการทาย
  let currentGuess = ""; // คำทายปัจจุบัน
  let done = false; // สถานะของเกม (จบหรือไม่)
  let isLoading = true; // สถานะการโหลดข้อมูล

  //ดึงคำศัพท์จาก API
  const res = await fetch("https://words.dev-apis.com/word-of-the-day");
  const { word: wordRes } = await res.json();
  const word = wordRes.toUpperCase(); // แปลงคำที่ได้รับให้เป็นตัวพิมพ์ใหญ่
  const wordParts = word.split(""); // แยกคำออกเป็นอักขระแต่ละตัว
  isLoading = false; // ตั้งค่าสถานะการโหลดเป็น false
  setLoading(isLoading); // ซ่อน loading indicator

  //ตัวอักษรลงในคำทาย
  function addLetter(letter) {
    if (currentGuess.length < ANSWER_LENGTH) {
      currentGuess += letter; // ถ้ายังไม่ครบ 5 ตัวอักษร ให้เพิ่มตัวอักษรลงในคำทาย
    } else {
      currentGuess =
        currentGuess.substring(0, currentGuess.length - 1) + letter; // ถ้าครบ 5 ตัวอักษรแล้ว ให้แทนที่ตัวสุดท้าย
    }

    letters[currentRow * ANSWER_LENGTH + currentGuess.length - 1].innerText =
      letter; // อัปเดตตัวอักษรใน DOM
  }

  //ยืนยันคำทาย
  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      return; // ถ้าคำทายไม่ครบ 5 ตัวอักษร ให้ทำอะไร
    }

    isLoading = true;
    setLoading(isLoading); // แสดง loading indicator
    const res = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      body: JSON.stringify({ word: currentGuess }), // ส่งคำทายไปตรวจสอบ
    });
    const { validWord } = await res.json();
    isLoading = false;
    setLoading(isLoading); // ซ่อน loading indicator

    if (!validWord) {
      markInvalidWord(); // ถ้าคำทายไม่ถูกต้อง ให้แสดงว่าไม่ถูกต้อง
      return;
    }

    const guessParts = currentGuess.split(""); // แยกคำทายเป็นอักขระแต่ละตัว
    const map = makeMap(wordParts); // สร้างแผนที่ของคำตอบ
    let allRight = true; // ตั้งค่าสถานะว่าเดาถูกทั้งหมดหรือไม่

    // ตรวจสอบคำทายกับคำตอบ
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        letters[currentRow * ANSWER_LENGTH + i].classList.add("correct"); // ถ้าถูกตำแหน่งและตัวอักษร
        map[guessParts[i]]--;
      }
    }

    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // ทำอะไร
      } else if (map[guessParts[i]] && map[guessParts[i]] > 0) {
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add("close"); // ถ้าถูกตัวอักษรแต่ผิดตำแหน่ง
        map[guessParts[i]]--;
      } else {
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong"); // ถ้าผิดตัวอักษร
      }
    }

    currentRow++;
    currentGuess = "";
    if (allRight) {
      alert("you win"); // ถ้าถูกทั้งหมด ให้แสดงข้อความว่าชนะ
      document.querySelector(".brand").classList.add("winner");
      done = true;
    } else if (currentRow === ROUNDS) {
      alert(`you lose, the word was ${word}`); // ถ้าทายครบ 6 รอบแล้ว ให้แสดงข้อความว่าแพ้
      done = true;
    }
  }

  //ลบตัวอักษรตัวสุดท้าย
  function backspace() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1); // ลบตัวอักษรสุดท้าย
    letters[currentRow * ANSWER_LENGTH + currentGuess.length].innerText = ""; // ลบตัวอักษรจาก DOM
  }

  //แสดงคำทายที่ไม่ถูกต้อง
  function markInvalidWord() {
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");

      // Using IIFE to create a new scope for i and currentRow
      (function (currentRow, i) {
        setTimeout(
          () =>
            letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid"),
          10
        );
      })(currentRow, i);
    }
  }

  //เหตุการณ์จากการกดแป้นพิมพ์
  document.addEventListener("keydown", function handleKeyPress(event) {
    if (done || isLoading) {
      return;
    }

    const action = event.key;

    if (action === "Enter") {
      commit();
    } else if (action === "Backspace") {
      backspace();
    } else if (isLetter(action)) {
      addLetter(action.toUpperCase());
    } else {
      // ทำอะไร
    }
  });
}

//ตรวจสอบว่าตัวอักษรเป็นอักษรภาษาอังกฤษ
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

//แสดง/ซ่อน loading indicator
function setLoading(isLoading) {
  loadingDiv.classList.toggle("hidden", !isLoading);
}

//สร้างแผนที่ของอักขระในคำตอบ
function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    if (obj[array[i]]) {
      obj[array[i]]++;
    } else {
      obj[array[i]] = 1;
    }
  }
  return obj;
}

document.addEventListener("DOMContentLoaded", function () {
  init();
});
