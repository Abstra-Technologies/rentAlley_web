// components/landlordVerification/steps/Step3Selfie.jsx
import SelfieCapture from "../camera/SelfieCapture";

export default function Step3Selfie({
                                        isCameraOpen, setIsCameraOpen,
                                        cameraError, hasCamera,
                                        webcamRef,
                                        selfie, setSelfie,
                                        requestCameraPermission, detectCameraDevices
                                    }) {
    return (
        <SelfieCapture
            isCameraOpen={isCameraOpen}
            setIsCameraOpen={setIsCameraOpen}
            cameraError={cameraError}
            hasCamera={hasCamera}
            webcamRef={webcamRef}
            selfie={selfie}
            setSelfie={setSelfie}
            requestCameraPermission={requestCameraPermission}
            detectCameraDevices={detectCameraDevices}
        />
    );
}
