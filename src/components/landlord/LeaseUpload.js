"use client";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";

const LeaseUpload = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    onFileUpload(uploadedFile); // Pass file to parent component
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "application/pdf",
  });

  return (
    <div className="border p-4 rounded-lg shadow-lg bg-white">
      <div
        {...getRootProps()}
        className="border-dashed border-2 border-gray-400 p-6 text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-green-500">{file.name}</p>
        ) : (
          <p>Upload Lease Agreement here (PDF Only).</p>
        )}
      </div>
    </div>
  );
};

export default LeaseUpload;
