const params = new URLSearchParams(window.location.search);
const id = params.get("id") || "default";
const storageKey = `countdownState_${id}`;
let sequences;
if (id === "pass") {
    sequences = [
        { title: "进场准备时间", duration: 90 },
        { title: "第一回合", duration: 90 },
        { title: "第二回合准备时间", duration: 60 },
        { title: "第二回合", duration: 120 },
        { title: "第三回合准备时间", duration: 60 },
        { title: "第三回合", duration: 120 },
        { title: "退场时间", duration: 60 }
    ];
} else if (id === "shoot") {
    sequences = [
        { title: "进场准备时间", duration: 90 },
        { title: "第一回合", duration: 120 },
        { title: "第二回合准备时间", duration: 60 },
        { title: "第二回合", duration: 120 },
        { title: "第三回合准备时间", duration: 60 },
        { title: "第三回合", duration: 120 },
        { title: "退场时间", duration: 60 }
    ];
} else {
    sequences = [{ title: "默认阶段", duration: 10 }];
}
let current = 0;
let remaining = sequences[current].duration;
let interval = null;
let isPaused = false;
let defaultTitle
if (id === "pass") {
    defaultTitle = "自主传球计时器";
} else if (id === "shoot") {
    defaultTitle = "自主投篮计时器";
} else {
    defaultTitle = "计时器";
}

const titleEl = document.getElementById("title");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const resetBtn = document.getElementById("resetBtn");

function updateTimerDisplay() {
    const mins = Math.floor(0 / 60);
    const secs = remaining % 60;
    timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateButtons(state) {
    if (state === "ready") {
        startBtn.disabled = false; pauseBtn.disabled = true;
        startBtn.style.display = "inline-block"; pauseBtn.style.display = "inline-block";
        resumeBtn.style.display = "none"; resetBtn.style.display = "none";
    } else if (state === "running") {
        startBtn.disabled = true; pauseBtn.disabled = false;
        startBtn.style.display = "inline-block"; pauseBtn.style.display = "inline-block";
        resumeBtn.style.display = "none"; resetBtn.style.display = "none";
    } else if (state === "paused") {
        startBtn.style.display = "none"; pauseBtn.style.display = "none";
        resumeBtn.style.display = "inline-block"; resetBtn.style.display = "inline-block";
    } else if (state === "finished") {
        startBtn.style.display = "none"; pauseBtn.style.display = "none";
        resumeBtn.style.display = "inline-block"; resetBtn.style.display = "inline-block";
        resumeBtn.disabled = true; resetBtn.disabled = false;
    }
}

function saveState(runningState = "running") {
    localStorage.setItem(storageKey, JSON.stringify({
        current,
        remaining,
        isPaused,
        state: runningState
    }));
}

function loadState() {
    const data = localStorage.getItem(storageKey);
    if (!data) return;
    const { current: c, remaining: r, isPaused: p, state } = JSON.parse(data);

    current = c;
    remaining = r;
    isPaused = p;

    if (state === "ready") {
        clearInterval(interval);
        titleEl.textContent = defaultTitle;
        remaining = sequences[0].duration;
        updateTimerDisplay();
        updateButtons("ready");
        return;
    } else if (state === "finished") {
        clearInterval(interval);
        titleEl.textContent = "比赛结束!";
        remaining = 0;
        updateTimerDisplay();
        updateButtons("finished");
        return;
    }

    titleEl.textContent = sequences[current] ? sequences[current].title : "比赛结束!";
    updateTimerDisplay();

    if (state === "paused") updateButtons("paused");
    else if (state === "running") updateButtons("running"); // 不启动 interval
}

function startTimer() {
    titleEl.textContent = sequences[current].title;
    updateButtons("running");
    clearInterval(interval);
    interval = setInterval(() => {
        if (!isPaused) {
            remaining--;
            updateTimerDisplay();
            saveState("running");

            if (remaining <= 0) {
                clearInterval(interval);
                current++;
                if (current < sequences.length) {
                    remaining = sequences[current].duration;
                    startTimer(); // 主页面继续下一个阶段
                } else {
                    // 倒计时结束
                    clearInterval(interval);
                    titleEl.textContent = "比赛结束!";
                    remaining = 0;
                    updateTimerDisplay();
                    updateButtons("finished");
                    // 同步给其他标签页
                    localStorage.setItem(storageKey, JSON.stringify({
                        current, remaining, isPaused: true, state: "finished"
                    }));
                }
            }
        }
    }, 1000);
}

// 按钮事件
startBtn.addEventListener("click", () => {
    isPaused = false;
    saveState("running");
    startTimer();
});

pauseBtn.addEventListener("click", () => {
    isPaused = true;
    clearInterval(interval);
    updateButtons("paused");
    saveState("paused");
});

resumeBtn.addEventListener("click", () => {
    isPaused = false;
    saveState("running");
    updateButtons("running");
    startTimer();
});

resetBtn.addEventListener("click", () => {
    clearInterval(interval);
    current = 0; remaining = sequences[0].duration; isPaused = false;
    titleEl.textContent = defaultTitle;
    updateTimerDisplay();
    updateButtons("ready");

    // 同步 Ready 状态
    localStorage.setItem(storageKey, JSON.stringify({
        current, remaining, isPaused, state: "ready"
    }));
});

// 同步其他标签页
window.addEventListener("storage", (event) => {
    if (event.key === storageKey) loadState();
});

// 初始化显示
updateTimerDisplay();
updateButtons("ready");
loadState();
