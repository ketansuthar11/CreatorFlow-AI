"use client";

import { useState } from "react";

export default function Home() {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleVideoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setVideo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadVideo = async () => {
    if (!video) return;

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("video", video);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      alert("Video Uploaded Successfully");
    } catch (error) {
      console.error(error);
      alert("Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold mb-6">
        AI Content Factory
      </h1>

      <input
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
      />

      {previewUrl && (
        <video
          controls
          className="mt-6 w-full max-w-2xl"
        >
          <source src={previewUrl} />
        </video>
      )}

      <button
        onClick={uploadVideo}
        disabled={uploading}
        className="mt-6 px-6 py-3 bg-black text-white rounded"
      >
        {uploading
          ? "Uploading..."
          : "Upload Video"}
      </button>
    </main>
  );
}