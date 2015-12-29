TiltCalibrater = (function(){
	var tiltCalibrationDiv = document.getElementById('calibrate-tilt-settings-view')
	var GAMMA_BETA_DIFFERENCE_THRESHOLD = 30

	var Monitor = (function(){
		var tiltMonitorDiv = document.getElementById('tilt-monitor')
		return {
			targetSize: 250,
			setSize: function(size){
				var monitorSize = size/GAMMA_BETA_DIFFERENCE_THRESHOLD*this.targetSize
				tiltMonitorDiv.style.width = monitorSize+'px'
				tiltMonitorDiv.style.height = monitorSize+'px'	
			}
		}
	}())

	var correctionInfo = {
	}

	Calibrator = (function(){
		var stepNumber = 0;
		var stepsDivs = document.querySelectorAll('#calibrate-tilt-settings-view > .centered-overlay > *')
		var progressTestStepPage = function(){
			stepsDivs[stepNumber++].className = 'hidden'
			if(stepsDivs[stepNumber]) stepsDivs[stepNumber].className = ''
		}
		var steps = ['noop','left','flat','up','noop']
		var calculationsForSteps = {
			'noop': _.noop,
			'left' : function(gamma,beta){
				if(Math.abs(gamma-beta) > GAMMA_BETA_DIFFERENCE_THRESHOLD){
					//we have a clear distinction
					if(Math.abs(gamma)>Math.abs(beta)){
						//side to side is gamma
						correctionInfo.x = ['gamma',-gamma/Math.abs(gamma)]
					}else{
						//side to side is beta
						correctionInfo.x = ['beta',-beta/Math.abs(beta)]
					}
					Calibrator.nextStep()
				}
			},
			'flat' : function(gamma,beta){
				if(Math.abs(gamma-beta) < 7){
					Calibrator.nextStep()
				}
			},
			'up'   : function(gamma, beta){
				if(Math.abs(gamma-beta) > GAMMA_BETA_DIFFERENCE_THRESHOLD){
					if(Math.abs(gamma)>Math.abs(beta)){
						//side to side is gamma
						correctionInfo.y = ['gamma',-gamma/Math.abs(gamma)]
					}else{
						//side to side is beta
						correctionInfo.y = ['beta',-beta/Math.abs(beta)]
					}
					window.removeEventListener('deviceorientation',Calibrator.eventAdapter)
					ControlsAdapter.useCorrectionInfo(correctionInfo)
					tiltCalibrationDiv.className = 'hidden'
					showUntilTap(document.getElementById('tilt-calibration-success'))
					Calibrator.nextStep()
				}
			}
		}
		return {
			nextStep: progressTestStepPage,
			giveDataForStep: function(gamma, beta){
				calculationsForSteps[steps[stepNumber]](gamma,beta)
			},
			eventAdapter: function(e){
				Monitor.setSize(Math.abs(e.beta-e.gamma))
				Calibrator.giveDataForStep(e.gamma, e.beta)
			}
		}


	}())

	return {
		doTiltCalibration: function(){
			tiltCalibrationDiv.className = ''
			startTest = function(){
				Calibrator.nextStep()
				window.addEventListener('deviceorientation', Calibrator.eventAdapter)
				tiltCalibrationDiv.removeEventListener('touchstart', startTest)
			}
			tiltCalibrationDiv.addEventListener('touchstart', startTest)
		}
	}
}())