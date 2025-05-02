if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const android$1 = plus.android;
  const RingtoneManager = android$1.import("android.media.RingtoneManager");
  android$1.import("android.net.Uri");
  const _sfc_main$2 = {
    data() {
      return {
        timeRemaining: 5400,
        // 90分钟 = 5400秒
        isRunning: false,
        currentPhase: "专注时间",
        timer: null,
        randomTimer: null,
        settings: {
          minInterval: 3,
          // 3分钟
          maxInterval: 5,
          // 5分钟
          focusDuration: 5400,
          // 90分钟
          breakDuration: 1200,
          // 20分钟
          reminderSound: "default",
          phaseSound: "default",
          vibrateOnReminder: true,
          vibrateOnPhase: true
        }
      };
    },
    onLoad() {
      try {
        const savedSettings = uni.getStorageSync("focusSettings");
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings);
          this.timeRemaining = this.settings.focusDuration;
        }
      } catch (e) {
        formatAppLog("error", "at pages/index/index.vue:64", "加载设置失败:", e);
      }
    },
    onUnload() {
      this.pauseTimer();
    },
    computed: {
      formatTime() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
    },
    methods: {
      toggleTimer() {
        if (this.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      },
      startTimer() {
        this.isRunning = true;
        this.timer = setInterval(() => {
          this.timeRemaining--;
          if (this.timeRemaining <= 0) {
            this.handlePhaseComplete();
          }
        }, 1e3);
        if (this.currentPhase === "专注时间") {
          this.scheduleRandomReminder();
        }
      },
      pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        clearTimeout(this.randomTimer);
      },
      resetTimer() {
        this.pauseTimer();
        this.timeRemaining = this.settings.focusDuration;
        this.currentPhase = "专注时间";
      },
      handlePhaseComplete() {
        this.playNotification();
        if (this.currentPhase === "专注时间") {
          this.currentPhase = "休息时间";
          this.timeRemaining = this.settings.breakDuration;
          if (this.settings.vibrateOnPhase) {
            this.vibrateMultipleTimes(3);
          }
        } else {
          this.currentPhase = "专注时间";
          this.timeRemaining = this.settings.focusDuration;
          if (this.settings.vibrateOnPhase) {
            uni.vibrateLong({
              success: function() {
                formatAppLog("log", "at pages/index/index.vue:124", "长震动成功");
              }
            });
          }
        }
      },
      // 多次震动方法
      vibrateMultipleTimes(times) {
        let count = 0;
        const vibrate = () => {
          if (count < times) {
            uni.vibrateLong({
              success: () => {
                formatAppLog("log", "at pages/index/index.vue:137", `第${count + 1}次长震动成功`);
                count++;
                setTimeout(vibrate, 500);
              }
            });
          }
        };
        vibrate();
      },
      scheduleRandomReminder() {
        if (this.currentPhase !== "专注时间")
          return;
        const minSeconds = this.settings.minInterval * 60;
        const maxSeconds = this.settings.maxInterval * 60;
        const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds);
        formatAppLog("log", "at pages/index/index.vue:156", `下次提醒将在 ${Math.floor(randomSeconds / 60)}分${randomSeconds % 60}秒 后`);
        this.randomTimer = setTimeout(() => {
          this.playReminder();
          if (this.isRunning && this.currentPhase === "专注时间") {
            this.scheduleRandomReminder();
          }
        }, randomSeconds * 1e3);
      },
      playReminder() {
        if (this.currentPhase !== "专注时间")
          return;
        uni.showToast({
          title: "保持专注！",
          icon: "none"
        });
        if (this.settings.reminderSound === "default" && this.settings.reminderSound !== "mute") {
          this.playDefaultNotification();
        } else if (this.settings.reminderSound && this.settings.reminderSound !== "mute") {
          const innerAudioContext = uni.createInnerAudioContext();
          innerAudioContext.src = this.settings.reminderSound;
          innerAudioContext.play();
        }
        if (this.settings.vibrateOnReminder) {
          uni.vibrateLong({
            success: function() {
              formatAppLog("log", "at pages/index/index.vue:188", "长震动成功");
            }
          });
        }
      },
      playNotification() {
        if (this.settings.phaseSound === "default" && this.settings.phaseSound !== "mute") {
          this.playDefaultNotification();
        } else if (this.settings.phaseSound && this.settings.phaseSound !== "mute") {
          const innerAudioContext = uni.createInnerAudioContext();
          innerAudioContext.src = this.settings.phaseSound;
          innerAudioContext.play();
        }
        uni.showToast({
          title: this.currentPhase === "专注时间" ? "休息时间到！" : "开始专注！",
          icon: "none"
        });
      },
      playDefaultNotification() {
        try {
          const main = plus.android.runtimeMainActivity();
          const ringtoneManager = new RingtoneManager(main);
          const notificationUri = ringtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
          const ringtone = ringtoneManager.getRingtone(main, notificationUri);
          const playMethod = plus.android.invoke(ringtone, "play");
          if (playMethod) {
            playMethod();
          }
        } catch (e) {
          formatAppLog("error", "at pages/index/index.vue:221", "播放提示音失败:", e);
          uni.showToast({
            title: "提示音播放失败",
            icon: "none"
          });
        }
      },
      openSettings() {
        uni.navigateTo({
          url: "/pages/settings/settings"
        });
      }
    },
    onShow() {
      try {
        const savedSettings = uni.getStorageSync("focusSettings");
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings);
          if (!this.isRunning) {
            this.timeRemaining = this.settings.focusDuration;
          }
        }
      } catch (e) {
        formatAppLog("error", "at pages/index/index.vue:246", "加载设置失败:", e);
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 阶段显示 "),
      vue.createElementVNode("view", { class: "phase-indicator" }, [
        vue.createElementVNode(
          "text",
          { class: "phase-text" },
          vue.toDisplayString($data.currentPhase),
          1
          /* TEXT */
        )
      ]),
      vue.createCommentVNode(" 计时器圆环 "),
      vue.createElementVNode("view", { class: "timer-circle" }, [
        vue.createElementVNode("view", { class: "timer-display" }, [
          vue.createElementVNode(
            "text",
            { class: "time" },
            vue.toDisplayString($options.formatTime),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 控制按钮 "),
      vue.createElementVNode("view", { class: "controls" }, [
        vue.createElementVNode(
          "button",
          {
            onClick: _cache[0] || (_cache[0] = (...args) => $options.toggleTimer && $options.toggleTimer(...args)),
            class: vue.normalizeClass(["control-btn", $data.isRunning ? "pause" : "start"])
          },
          vue.toDisplayString($data.isRunning ? "暂停" : "开始"),
          3
          /* TEXT, CLASS */
        ),
        vue.createElementVNode("button", {
          onClick: _cache[1] || (_cache[1] = (...args) => $options.resetTimer && $options.resetTimer(...args)),
          class: "control-btn reset"
        }, "重置")
      ]),
      vue.createCommentVNode(" 设置按钮 "),
      vue.createElementVNode("view", { class: "settings" }, [
        vue.createElementVNode("button", {
          onClick: _cache[2] || (_cache[2] = (...args) => $options.openSettings && $options.openSettings(...args)),
          class: "settings-btn"
        }, "设置")
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "C:/Users/hanhu/Documents/HBuilderProjects/efficient_learning/pages/index/index.vue"]]);
  const android = plus.android;
  const Intent = android.import("android.content.Intent");
  android.import("android.net.Uri");
  android.import("java.io.File");
  android.import("android.os.Environment");
  const _sfc_main$1 = {
    data() {
      return {
        settings: {
          minInterval: 3,
          maxInterval: 5,
          focusDuration: 5400,
          breakDuration: 1200,
          reminderSound: "default",
          phaseSound: "default",
          vibrateOnReminder: true,
          vibrateOnPhase: true
        },
        // 用于显示的分钟数
        focusMinutes: 90,
        breakMinutes: 20
      };
    },
    onLoad() {
      try {
        const savedSettings = uni.getStorageSync("focusSettings");
        if (savedSettings) {
          this.settings = JSON.parse(savedSettings);
          this.focusMinutes = this.settings.focusDuration / 60;
          this.breakMinutes = this.settings.breakDuration / 60;
        }
      } catch (e) {
        formatAppLog("error", "at pages/settings/settings.vue:109", "加载设置失败:", e);
      }
    },
    methods: {
      handleFocusDurationChange(e) {
        const value = parseInt(e.detail.value);
        if (!isNaN(value) && value > 0) {
          this.focusMinutes = value;
          this.settings.focusDuration = value * 60;
        }
      },
      handleBreakDurationChange(e) {
        const value = parseInt(e.detail.value);
        if (!isNaN(value) && value > 0) {
          this.breakMinutes = value;
          this.settings.breakDuration = value * 60;
        }
      },
      handleMinIntervalChange(e) {
        const value = parseInt(e.detail.value);
        if (!isNaN(value) && value > 0) {
          this.settings.minInterval = value;
        }
      },
      handleMaxIntervalChange(e) {
        const value = parseInt(e.detail.value);
        if (!isNaN(value) && value > 0) {
          this.settings.maxInterval = value;
        }
      },
      handleReminderSoundChange(e) {
        const value = e.detail.value;
        if (value === "custom") {
          this.selectReminderSound();
        } else {
          this.settings.reminderSound = value;
        }
      },
      handlePhaseSoundChange(e) {
        const value = e.detail.value;
        if (value === "custom") {
          this.selectPhaseSound();
        } else {
          this.settings.phaseSound = value;
        }
      },
      handleVibrateChange(e) {
        this.settings.vibrateOnReminder = e.detail.value;
      },
      handlePhaseVibrateChange(e) {
        this.settings.vibrateOnPhase = e.detail.value;
      },
      selectReminderSound() {
        const main = plus.android.runtimeMainActivity();
        const intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("audio/*");
        main.startActivityForResult(intent, 0, (requestCode, resultCode, data) => {
          if (resultCode === -1) {
            const uri = data.getData();
            this.settings.reminderSound = uri.toString();
          }
        });
      },
      selectPhaseSound() {
        const main = plus.android.runtimeMainActivity();
        const intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("audio/*");
        main.startActivityForResult(intent, 0, (requestCode, resultCode, data) => {
          if (resultCode === -1) {
            const uri = data.getData();
            this.settings.phaseSound = uri.toString();
          }
        });
      },
      saveSettings() {
        try {
          this.settings.focusDuration = this.focusMinutes * 60;
          this.settings.breakDuration = this.breakMinutes * 60;
          uni.setStorageSync("focusSettings", JSON.stringify(this.settings));
          uni.showToast({
            title: "设置已保存",
            icon: "success"
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } catch (e) {
          formatAppLog("error", "at pages/settings/settings.vue:198", "保存设置失败:", e);
          uni.showToast({
            title: "保存失败",
            icon: "none"
          });
        }
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "settings-group" }, [
        vue.createElementVNode("view", { class: "settings-title" }, "时间设置"),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "专注时长（分钟）"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "number",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.focusMinutes = $event),
              onChange: _cache[1] || (_cache[1] = (...args) => $options.handleFocusDurationChange && $options.handleFocusDurationChange(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.focusMinutes]
          ])
        ]),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "休息时长（分钟）"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              type: "number",
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.breakMinutes = $event),
              onChange: _cache[3] || (_cache[3] = (...args) => $options.handleBreakDurationChange && $options.handleBreakDurationChange(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.breakMinutes]
          ])
        ]),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "提醒间隔（分钟）"),
          vue.createElementVNode("view", { class: "interval-range" }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "number",
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.settings.minInterval = $event),
                onChange: _cache[5] || (_cache[5] = (...args) => $options.handleMinIntervalChange && $options.handleMinIntervalChange(...args))
              },
              null,
              544
              /* NEED_HYDRATION, NEED_PATCH */
            ), [
              [vue.vModelText, $data.settings.minInterval]
            ]),
            vue.createElementVNode("text", null, "至"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                type: "number",
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.settings.maxInterval = $event),
                onChange: _cache[7] || (_cache[7] = (...args) => $options.handleMaxIntervalChange && $options.handleMaxIntervalChange(...args))
              },
              null,
              544
              /* NEED_HYDRATION, NEED_PATCH */
            ), [
              [vue.vModelText, $data.settings.maxInterval]
            ])
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "settings-group" }, [
        vue.createElementVNode("view", { class: "settings-title" }, "提醒设置"),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "提醒提示音"),
          vue.createElementVNode(
            "radio-group",
            {
              onChange: _cache[8] || (_cache[8] = (...args) => $options.handleReminderSoundChange && $options.handleReminderSoundChange(...args))
            },
            [
              vue.createElementVNode("label", { class: "radio" }, [
                vue.createElementVNode("radio", {
                  value: "default",
                  checked: $data.settings.reminderSound === "default"
                }, null, 8, ["checked"]),
                vue.createTextVNode("默认 ")
              ]),
              vue.createElementVNode("label", { class: "radio" }, [
                vue.createElementVNode("radio", {
                  value: "mute",
                  checked: $data.settings.reminderSound === "mute"
                }, null, 8, ["checked"]),
                vue.createTextVNode("静音 ")
              ]),
              vue.createElementVNode("label", { class: "radio" }, [
                vue.createElementVNode("radio", {
                  value: "custom",
                  checked: $data.settings.reminderSound !== "default" && $data.settings.reminderSound !== "mute"
                }, null, 8, ["checked"]),
                vue.createTextVNode("自定义 ")
              ])
            ],
            32
            /* NEED_HYDRATION */
          ),
          $data.settings.reminderSound === "custom" ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            onClick: _cache[9] || (_cache[9] = (...args) => $options.selectReminderSound && $options.selectReminderSound(...args)),
            class: "select-btn"
          }, "选择音频")) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "阶段提示音"),
          vue.createElementVNode(
            "radio-group",
            {
              onChange: _cache[10] || (_cache[10] = (...args) => $options.handlePhaseSoundChange && $options.handlePhaseSoundChange(...args))
            },
            [
              vue.createElementVNode("label", { class: "radio" }, [
                vue.createElementVNode("radio", {
                  value: "default",
                  checked: $data.settings.phaseSound === "default"
                }, null, 8, ["checked"]),
                vue.createTextVNode("默认 ")
              ]),
              vue.createElementVNode("label", { class: "radio" }, [
                vue.createElementVNode("radio", {
                  value: "mute",
                  checked: $data.settings.phaseSound === "mute"
                }, null, 8, ["checked"]),
                vue.createTextVNode("静音 ")
              ]),
              vue.createElementVNode("label", { class: "radio" }, [
                vue.createElementVNode("radio", {
                  value: "custom",
                  checked: $data.settings.phaseSound !== "default" && $data.settings.phaseSound !== "mute"
                }, null, 8, ["checked"]),
                vue.createTextVNode("自定义 ")
              ])
            ],
            32
            /* NEED_HYDRATION */
          ),
          $data.settings.phaseSound === "custom" ? (vue.openBlock(), vue.createElementBlock("button", {
            key: 0,
            onClick: _cache[11] || (_cache[11] = (...args) => $options.selectPhaseSound && $options.selectPhaseSound(...args)),
            class: "select-btn"
          }, "选择音频")) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.createElementVNode("view", { class: "settings-group" }, [
        vue.createElementVNode("view", { class: "settings-title" }, "震动设置"),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "提醒震动"),
          vue.createElementVNode("switch", {
            checked: $data.settings.vibrateOnReminder,
            onChange: _cache[12] || (_cache[12] = (...args) => $options.handleVibrateChange && $options.handleVibrateChange(...args))
          }, null, 40, ["checked"])
        ]),
        vue.createElementVNode("view", { class: "settings-item" }, [
          vue.createElementVNode("text", null, "阶段震动"),
          vue.createElementVNode("switch", {
            checked: $data.settings.vibrateOnPhase,
            onChange: _cache[13] || (_cache[13] = (...args) => $options.handlePhaseVibrateChange && $options.handlePhaseVibrateChange(...args))
          }, null, 40, ["checked"])
        ])
      ]),
      vue.createElementVNode("button", {
        onClick: _cache[14] || (_cache[14] = (...args) => $options.saveSettings && $options.saveSettings(...args)),
        class: "save-btn"
      }, "保存设置")
    ]);
  }
  const PagesSettingsSettings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "C:/Users/hanhu/Documents/HBuilderProjects/efficient_learning/pages/settings/settings.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/settings/settings", PagesSettingsSettings);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("warn", "at App.vue:4", "当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！");
      formatAppLog("log", "at App.vue:5", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:8", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:11", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/Users/hanhu/Documents/HBuilderProjects/efficient_learning/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
