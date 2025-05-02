<template>
	<view class="container">
		<!-- 阶段显示 -->
		<view class="phase-indicator">
			<text class="phase-text">{{currentPhase}}</text>
		</view>
		
		<!-- 计时器圆环 -->
		<view class="timer-circle">
			<view class="timer-display">
				<text class="time">{{formatTime}}</text>
			</view>
		</view>
		
		<!-- 控制按钮 -->
		<view class="controls">
			<button @click="toggleTimer" :class="['control-btn', isRunning ? 'pause' : 'start']">
				{{isRunning ? '暂停' : '开始'}}
			</button>
			<button @click="resetTimer" class="control-btn reset">重置</button>
		</view>
		
		<!-- 设置按钮 -->
		<view class="settings">
			<button @click="openSettings" class="settings-btn">设置</button>
		</view>
	</view>
</template>

<script>
	const android = plus.android;
	const RingtoneManager = android.import('android.media.RingtoneManager');
	const Uri = android.import('android.net.Uri');

	export default {
		data() {
			return {
				timeRemaining: 5400, // 90分钟 = 5400秒
				isRunning: false,
				currentPhase: '专注时间',
				timer: null,
				randomTimer: null,
				settings: {
					minInterval: 3, // 3分钟
					maxInterval: 5, // 5分钟
					focusDuration: 5400, // 90分钟
					breakDuration: 1200, // 20分钟
					reminderSound: 'default',
					phaseSound: 'default',
					vibrateOnReminder: true,
					vibrateOnPhase: true
				}
			}
		},
		onLoad() {
			// 加载保存的设置
			try {
				const savedSettings = uni.getStorageSync('focusSettings')
				if (savedSettings) {
					this.settings = JSON.parse(savedSettings)
					this.timeRemaining = this.settings.focusDuration
				}
			} catch (e) {
				console.error('加载设置失败:', e)
			}
		},
		onUnload() {
			this.pauseTimer()
		},
		computed: {
			formatTime() {
				const minutes = Math.floor(this.timeRemaining / 60)
				const seconds = this.timeRemaining % 60
				return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
			}
		},
		methods: {
			toggleTimer() {
				if (this.isRunning) {
					this.pauseTimer()
				} else {
					this.startTimer()
				}
			},
			startTimer() {
				this.isRunning = true
				this.timer = setInterval(() => {
					this.timeRemaining--
					if (this.timeRemaining <= 0) {
						this.handlePhaseComplete()
					}
				}, 1000)
				// 只在专注时间内设置提醒
				if (this.currentPhase === '专注时间') {
					this.scheduleRandomReminder()
				}
			},
			pauseTimer() {
				this.isRunning = false
				clearInterval(this.timer)
				clearTimeout(this.randomTimer)
			},
			resetTimer() {
				this.pauseTimer()
				this.timeRemaining = this.settings.focusDuration
				this.currentPhase = '专注时间'
			},
			handlePhaseComplete() {
				this.playNotification()
				if (this.currentPhase === '专注时间') {
					this.currentPhase = '休息时间'
					this.timeRemaining = this.settings.breakDuration
					// 专注时间结束时的多次震动
					if (this.settings.vibrateOnPhase) {
						this.vibrateMultipleTimes(3)
					}
				} else {
					this.currentPhase = '专注时间'
					this.timeRemaining = this.settings.focusDuration
					// 休息时间结束时的长震动
					if (this.settings.vibrateOnPhase) {
						uni.vibrateLong({
							success: function () {
								console.log('长震动成功')
							}
						})
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
								console.log(`第${count + 1}次长震动成功`)
								count++;
								// 每次震动间隔500ms
								setTimeout(vibrate, 500);
							}
						});
					}
				};
				vibrate();
			},
			scheduleRandomReminder() {
				// 只在专注时间内设置提醒
				if (this.currentPhase !== '专注时间') return;
				
				// 生成3-5分钟之间的随机秒数
				const minSeconds = this.settings.minInterval * 60
				const maxSeconds = this.settings.maxInterval * 60
				const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds)
				
				console.log(`下次提醒将在 ${Math.floor(randomSeconds/60)}分${randomSeconds%60}秒 后`)
				
				this.randomTimer = setTimeout(() => {
					this.playReminder()
					if (this.isRunning && this.currentPhase === '专注时间') {
						this.scheduleRandomReminder()
					}
				}, randomSeconds * 1000)
			},
			playReminder() {
				// 只在专注时间内播放提醒
				if (this.currentPhase !== '专注时间') return;
				
				// 显示提醒提示
				uni.showToast({
					title: '保持专注！',
					icon: 'none'
				})
				
				// 根据设置播放声音
				if (this.settings.reminderSound === 'default' && this.settings.reminderSound !== 'mute') {
					this.playDefaultNotification()
				} else if (this.settings.reminderSound && this.settings.reminderSound !== 'mute') {
					const innerAudioContext = uni.createInnerAudioContext()
					innerAudioContext.src = this.settings.reminderSound
					innerAudioContext.play()
				}
				
				// 根据设置触发震动
				if (this.settings.vibrateOnReminder) {
					uni.vibrateLong({
						success: function () {
							console.log('长震动成功')
						}
					})
				}
			},
			playNotification() {
				// 根据设置播放声音
				if (this.settings.phaseSound === 'default' && this.settings.phaseSound !== 'mute') {
					this.playDefaultNotification()
				} else if (this.settings.phaseSound && this.settings.phaseSound !== 'mute') {
					const innerAudioContext = uni.createInnerAudioContext()
					innerAudioContext.src = this.settings.phaseSound
					innerAudioContext.play()
				}
				
				uni.showToast({
					title: this.currentPhase === '专注时间' ? '休息时间到！' : '开始专注！',
					icon: 'none'
				})
			},
			playDefaultNotification() {
				try {
					const main = plus.android.runtimeMainActivity();
					const ringtoneManager = new RingtoneManager(main);
					const notificationUri = ringtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
					const ringtone = ringtoneManager.getRingtone(main, notificationUri);
					
					// 使用反射调用play方法
					const playMethod = plus.android.invoke(ringtone, "play");
					if (playMethod) {
						playMethod();
					}
				} catch (e) {
					console.error('播放提示音失败:', e);
					// 如果播放失败，尝试使用系统通知
					uni.showToast({
						title: '提示音播放失败',
						icon: 'none'
					});
				}
			},
			openSettings() {
				uni.navigateTo({
					url: '/pages/settings/settings'
				})
			}
		},
		onShow() {
			// 从设置页面返回时重新加载设置
			try {
				const savedSettings = uni.getStorageSync('focusSettings')
				if (savedSettings) {
					this.settings = JSON.parse(savedSettings)
					if (!this.isRunning) {
						this.timeRemaining = this.settings.focusDuration
					}
				}
			} catch (e) {
				console.error('加载设置失败:', e)
			}
		}
	}
</script>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	.phase-indicator {
		margin-bottom: 40rpx;
		background-color: #4CAF50;
		padding: 16rpx 32rpx;
		border-radius: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.phase-text {
		color: white;
		font-size: 32rpx;
		font-weight: bold;
	}

	.timer-circle {
		width: 300rpx;
		height: 300rpx;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 60rpx;
	}

	.timer-display {
		text-align: center;
	}

	.time {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
	}

	.controls {
		display: flex;
		gap: 20rpx;
		margin-bottom: 40rpx;
	}

	.control-btn {
		padding: 20rpx 40rpx;
		border-radius: 30rpx;
		font-size: 28rpx;
		border: none;
	}

	.start {
		background-color: #4CAF50;
		color: white;
	}

	.pause {
		background-color: #FF9800;
		color: white;
	}

	.reset {
		background-color: #f5f5f5;
		color: #666;
		border: 1rpx solid #ddd;
	}

	.settings-btn {
		padding: 16rpx 32rpx;
		background-color: #f5f5f5;
		color: #666;
		border: 1rpx solid #ddd;
		border-radius: 24rpx;
		font-size: 24rpx;
	}
</style>
