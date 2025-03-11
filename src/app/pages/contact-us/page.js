export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Contact Us</h1>
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-lg">
        <input
          className="w-full p-3 border rounded mb-4"
          type="text"
          placeholder="Your Name"
        />
        <input
          className="w-full p-3 border rounded mb-4"
          type="email"
          placeholder="Your Email"
        />
        <textarea
          className="w-full p-3 border rounded mb-4"
          placeholder="Your Message"
          rows="4"
        ></textarea>
        <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Send Message
        </button>
      </form>
    </div>
  );
}
