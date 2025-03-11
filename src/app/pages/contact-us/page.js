

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center py-16 px-4">
      <div className="text-center mb-10">
        <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
          Get in Touch
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900">Contact Us</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl">
          Have questions or need assistance? Reach out to us, and we’ll be happy to help!
        </p>
      </div>
      
      <form className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
        <div className="mb-4">
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            type="text"
            placeholder="Your Name"
          />
        </div>
        <div className="mb-4">
          <input
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            type="email"
            placeholder="Your Email"
          />
        </div>
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            placeholder="Your Message"
            rows="4"
          ></textarea>
        </div>
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md">
          Send Message
        </button>
      </form>
    </div>
  );
}