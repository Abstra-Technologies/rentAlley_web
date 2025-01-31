import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const SelfieCapture = () => {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user",
    };


//modify this where to save.
    const capturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
    };

    return (
        <div style={{ textAlign: "center" }}>
            <h2>Take a Selfie</h2>

            {/* Webcam View */}
            {!capturedImage && (
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    style={{
                        width: "100%",
                        maxWidth: "600px",
                        borderRadius: "8px",
                        margin: "20px auto",
                    }}
                />
            )}

            {/* Captured Image */}
            {capturedImage && (
                <img
                    src={capturedImage}
                    alt="Captured selfie"
                    style={{
                        width: "100%",
                        maxWidth: "600px",
                        borderRadius: "8px",
                        margin: "20px auto",
                    }}
                />
            )}

            {/* Buttons */}
            <div style={{ marginTop: "20px" }}>
                {!capturedImage ? (
                    <button onClick={capturePhoto} style={buttonStyle}>
                        Take Selfie
                    </button>
                ) : (
                    <button onClick={() => setCapturedImage(null)} style={buttonStyle}>
                        Retake
                    </button>
                )}
            </div>
        </div>
    );
};

const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#6200ea",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
};

export default SelfieCapture;
