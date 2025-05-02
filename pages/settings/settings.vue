<template>
	<view class="container">
		<view class="settings-group">
			<view class="settings-title">时间设置</view>
			<view class="settings-item">
				<text>专注时长（分钟）</text>
				<input type="number" v-model="focusMinutes" @change="handleFocusDurationChange" />
			</view>
			<view class="settings-item">
				<text>休息时长（分钟）</text>
				<input type="number" v-model="breakMinutes" @change="handleBreakDurationChange" />
			</view>
			<view class="settings-item">
				<text>提醒间隔（分钟）</text>
				<view class="interval-range">
					<input type="number" v-model="settings.minInterval" @change="handleMinIntervalChange" />
					<text>至</text>
					<input type="number" v-model="settings.maxInterval" @change="handleMaxIntervalChange" />
				</view>
			</view>
		</view>

		<view class="settings-group">
			<view class="settings-title">提醒设置</view>
			<view class="settings-item">
				<text>提醒提示音</text>
				<radio-group @change="handleReminderSoundChange">
					<label class="radio">
						<radio value="default" :checked="settings.reminderSound === 'default'" />默认
					</label>
					<label class="radio">
						<radio value="mute" :checked="settings.reminderSound === 'mute'" />静音
					</label>
					<label class="radio">
						<radio value="custom" :checked="settings.reminderSound !== 'default' && settings.reminderSound !== 'mute'" />自定义
					</label>
				</radio-group>
				<button v-if="settings.reminderSound === 'custom'" @click="selectReminderSound" class="select-btn">选择音频</button>
			</view>
			<view class="settings-item">
				<text>阶段提示音</text>
				<radio-group @change="handlePhaseSoundChange">
					<label class="radio">
						<radio value="default" :checked="settings.phaseSound === 'default'" />默认
					</label>
					<label class="radio">
						<radio value="mute" :checked="settings.phaseSound === 'mute'" />静音
					</label>
					<label class="radio">
						<radio value="custom" :checked="settings.phaseSound !== 'default' && settings.phaseSound !== 'mute'" />自定义
					</label>
				</radio-group>
				<button v-if="settings.phaseSound === 'custom'" @click="selectPhaseSound" class="select-btn">选择音频</button>
			</view>
		</view>

		<view class="settings-group">
			<view class="settings-title">震动设置</view>
			<view class="settings-item">
				<text>提醒震动</text>
				<switch :checked="settings.vibrateOnReminder" @change="handleVibrateChange" />
			</view>
			<view class="settings-item">
				<text>阶段震动</text>
				<switch :checked="settings.vibrateOnPhase" @change="handlePhaseVibrateChange" />
			</view>
		</view>

		<button @click="saveSettings" class="save-btn">保存设置</button>
	</view>
</template>

<script>
const android = plus.android;
const Intent = android.import('android.content.Intent');
const Uri = android.import('android.net.Uri');
const File = android.import('java.io.File');
const Environment = android.import('android.os.Environment');

export default {
	data() {
		return {
			settings: {
				minInterval: 3,
				maxInterval: 5,
				focusDuration: 5400,
				breakDuration: 1200,
				reminderSound: 'default',
				phaseSound: 'default',
				vibrateOnReminder: true,
				vibrateOnPhase: true
			},
			// 用于显示的分钟数
			focusMinutes: 90,
			breakMinutes: 20
		}
	},
	onLoad() {
		// 加载保存的设置
		try {
			const savedSettings = uni.getStorageSync('focusSettings')
			if (savedSettings) {
				this.settings = JSON.parse(savedSettings)
				// 将秒数转换为分钟数用于显示
				this.focusMinutes = this.settings.focusDuration / 60
				this.breakMinutes = this.settings.breakDuration / 60
			}
		} catch (e) {
			console.error('加载设置失败:', e)
		}
	},
	methods: {
		handleFocusDurationChange(e) {
			const value = parseInt(e.detail.value)
			if (!isNaN(value) && value > 0) {
				this.focusMinutes = value
				this.settings.focusDuration = value * 60
			}
		},
		handleBreakDurationChange(e) {
			const value = parseInt(e.detail.value)
			if (!isNaN(value) && value > 0) {
				this.breakMinutes = value
				this.settings.breakDuration = value * 60
			}
		},
		handleMinIntervalChange(e) {
			const value = parseInt(e.detail.value)
			if (!isNaN(value) && value > 0) {
				this.settings.minInterval = value
			}
		},
		handleMaxIntervalChange(e) {
			const value = parseInt(e.detail.value)
			if (!isNaN(value) && value > 0) {
				this.settings.maxInterval = value
			}
		},
		handleReminderSoundChange(e) {
			const value = e.detail.value
			if (value === 'custom') {
				this.selectReminderSound()
			} else {
				this.settings.reminderSound = value
			}
		},
		handlePhaseSoundChange(e) {
			const value = e.detail.value
			if (value === 'custom') {
				this.selectPhaseSound()
			} else {
				this.settings.phaseSound = value
			}
		},
		handleVibrateChange(e) {
			this.settings.vibrateOnReminder = e.detail.value
		},
		handlePhaseVibrateChange(e) {
			this.settings.vibrateOnPhase = e.detail.value
		},
		selectReminderSound() {
			const main = plus.android.runtimeMainActivity();
			const intent = new Intent(Intent.ACTION_GET_CONTENT);
			intent.setType('audio/*');
			main.startActivityForResult(intent, 0, (requestCode, resultCode, data) => {
				if (resultCode === -1) { // RESULT_OK
					const uri = data.getData();
					this.settings.reminderSound = uri.toString();
				}
			});
		},
		selectPhaseSound() {
			const main = plus.android.runtimeMainActivity();
			const intent = new Intent(Intent.ACTION_GET_CONTENT);
			intent.setType('audio/*');
			main.startActivityForResult(intent, 0, (requestCode, resultCode, data) => {
				if (resultCode === -1) { // RESULT_OK
					const uri = data.getData();
					this.settings.phaseSound = uri.toString();
				}
			});
		},
		saveSettings() {
			try {
				// 确保时间设置正确
				this.settings.focusDuration = this.focusMinutes * 60
				this.settings.breakDuration = this.breakMinutes * 60
				
				uni.setStorageSync('focusSettings', JSON.stringify(this.settings))
				uni.showToast({
					title: '设置已保存',
					icon: 'success'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} catch (e) {
				console.error('保存设置失败:', e)
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			}
		}
	}
}
</script>

<style>
	.container {
		padding: 30rpx;
	}

	.settings-group {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.settings-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.settings-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.settings-item:last-child {
		border-bottom: none;
	}

	.settings-item text {
		font-size: 28rpx;
		color: #666;
	}

	input {
		width: 120rpx;
		height: 60rpx;
		border: 1rpx solid #ddd;
		border-radius: 10rpx;
		padding: 0 20rpx;
		text-align: center;
	}

	.interval-range {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.radio {
		margin-right: 30rpx;
	}

	.select-btn {
		margin-top: 20rpx;
		padding: 10rpx 20rpx;
		background-color: #f5f5f5;
		color: #666;
		border: 1rpx solid #ddd;
		border-radius: 10rpx;
		font-size: 24rpx;
	}

	.save-btn {
		margin-top: 40rpx;
		background-color: #4CAF50;
		color: white;
		padding: 20rpx 0;
		border-radius: 40rpx;
		font-size: 32rpx;
	}
</style> 