"use client";

import { useState } from "react";

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setStatus("Requesting presigned URL...");
      const res = await fetch("/api/test/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { url, key } = await res.json();
      setStatus(`URL received. Uploading to MinIO...`);

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status: ${uploadRes.status}`);
      }

      setStatus("Upload successful!");
      
      // Construct the public URL to test direct unauthenticated access
      // (This should fail with 403 according to our requirements)
      const publicEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || "http://localhost:9000";
      const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || "resourcedrop-bucket";
      setUploadedUrl(`${publicEndpoint}/${bucket}/${key}`);

    } catch (error: unknown) {
      console.error(error);
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", color: "black", backgroundColor: "white", minHeight: "100vh" }}>
      <h1>MinIO Presigned URL Upload Test</h1>
      
      <div style={{ margin: "20px 0" }}>
        <input type="file" onChange={handleFileChange} />
        <button 
          onClick={handleUpload} 
          disabled={!file}
          style={{ marginLeft: "10px", padding: "5px 10px" }}
        >
          Upload File
        </button>
      </div>

      <div style={{ padding: "15px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
        <strong>Status:</strong> {status}
      </div>

      {uploadedUrl && (
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
          <h3>File uploaded successfully!</h3>
          <p>Click the link below to verify unauthenticated access returns a 403 error:</p>
          <a href={uploadedUrl} target="_blank" rel="noreferrer" style={{ color: "blue", textDecoration: "underline" }}>
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
}
