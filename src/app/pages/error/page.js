import React from "react";

export default function ErrorPage({ statusCode }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">
          {statusCode || "Error"}
        </h1>
        <p className="text-xl mb-6">
          {statusCode === 404
            ? "Oops! The page you're looking for doesn't exist."
            : "An unexpected error has occurred. Please try again later."}
        </p>
        <a
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode || err?.statusCode || 404;
  return { statusCode };
};
