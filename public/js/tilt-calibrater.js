TiltCalibrater = {
	doTiltCalibration: function(){
		var tiltCalibrationDiv = document.getElementById('calibrate-tilt-settings-view')
		tiltCalibrationDiv.className = ''
		var outDiv = document.getElementById('orientation-data')
		var stepsDivs = document.querySelectorAll('#calibrate-tilt-settings-view > .centered-overlay > *')
		var stepNumber = 0
		var progressTestStepPage = function(){
			stepsDivs[stepNumber++].className = 'hidden'
			stepsDivs[stepNumber].className = ''
		}
		startTest = function(){
			progressTestStepPage()
			tiltCalibrationDiv.removeEventListener(startTest)
			calibrationStep = 'left'
			window.addEventListener('deviceorientation', orientationListener)
			tiltCalibrationDiv.removeEventListener('touchstart', startTest)
		}
		var calibrationStep = ''
		tiltCalibrationDiv.addEventListener('touchstart', startTest)
		var correctionInfo = {
		}
		var calibrationPause = 0
		var monitorTargetSize = 250
		var targetBetaGammDifference = 30
		var orientationListener = function(e){
			if(Date.now() < calibrationPause){
				return
			}
			var tiltMonitorDiv = document.getElementById('tilt-monitor')
			var monitorSize = Math.abs(e.gamma-e.beta)/targetBetaGammDifference*monitorTargetSize
			tiltMonitorDiv.style.width = monitorSize+'px'
			tiltMonitorDiv.style.height = monitorSize+'px'
			if(calibrationStep == 'left'){
				if(Math.abs(e.gamma-e.beta) > 30){
					//we have a clear distinction
					if(Math.abs(e.gamma)>Math.abs(e.beta)){
						//side to side is gamma
						correctionInfo.x = ['gamma',-e.gamma/Math.abs(e.gamma)]
					}else{
						//side to side is beta
						correctionInfo.x = ['beta',-e.beta/Math.abs(e.beta)]
					}

					calibrationStep = 'flat'
					progressTestStepPage()
				}
			}else if(calibrationStep == 'up'){
				if(Math.abs(e.gamma-e.beta) > 30){
					//we have a clear distinction
					if(Math.abs(e.gamma)>Math.abs(e.beta)){
						//side to side is gamma
						correctionInfo.y = ['gamma',-e.gamma/Math.abs(e.gamma)]
					}else{
						//side to side is beta
						correctionInfo.y = ['beta',-e.beta/Math.abs(e.beta)]
					}
					window.removeEventListener('deviceorientation',orientationListener)
					ControlsAdapter.useCorrectionInfo(correctionInfo)
					document.getElementById('console').innerHTML = JSON.stringify(correctionInfo)
					tiltCalibrationDiv.className = 'hidden'
					calibrationStep = ''
					showUntilTap(document.getElementById('tilt-calibration-success'))
				}
			}else if(calibrationStep == 'flat'){
				if(Math.abs(e.gamma-e.beta) < 7){
					calibrationStep = 'up'
					progressTestStepPage()
				}
			}
		}
	}
}
